const Order = require("../../models/Order");
const Product = require("../../models/Product");
const mongoose = require("mongoose");
const {
  sendOrderStatusUpdateEmail,
  sendOrderConfirmationEmail,
} = require("../../helpers/email");
const { syncSingleDeadlineToCalendar } = require("../auth/google-calendar-controller");

const getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const { archived } = req.query;
    const now = new Date();
    let query = {};
    
    // If archived="archive", show archived successful orders (pickedUp + isArchived)
    if (archived === "archive") {
      query.$and = [
        { isArchived: true },
        { orderStatus: "pickedUp" }
      ];
    }
    // If archived="true", show cancelled orders only
    // Note: Overdue orders should be automatically marked as cancelled by the cleanup service
    else if (archived === "true") {
      // Only show orders that are explicitly cancelled
      query.$and = [
        { orderStatus: "cancelled" },
        { isArchived: false }
      ];
    } else {
      // For "All Orders" view, exclude cancelled orders, overdue orders, and archived orders
      // Overdue orders should be treated as cancelled (they will be marked as cancelled by cleanup service)
      query.$and = [
        { orderStatus: { $ne: "cancelled" } },
        { isArchived: false },
        {
          $or: [
            // Orders without payment deadline (not confirmed yet)
            { paymentDeadline: { $exists: false } },
            { paymentDeadline: null },
            // Orders with payment deadline that hasn't passed
            { paymentDeadline: { $gte: now } },
            // Orders that are paid (even if deadline passed)
            { paymentStatus: "paid" },
            // Orders with payment proof submitted (even if deadline passed)
            { 
              paymentProof: { $exists: true, $ne: null, $ne: "" },
              paymentStatus: "pending"
            }
          ]
        }
      ];
    }

    const orders = await Order.find(query).populate("userId", "userName email").sort({ orderDate: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate("userId", "userName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    const linearStatuses = [
      "pending",
      "confirmed",
      "readyForPickup",
      "pickedUp",
    ];

    const currentStatus = order.orderStatus;

    if (currentStatus === "pickedUp" || currentStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Orders marked as ${currentStatus} can no longer be updated.`,
      });
    }

    if (orderStatus === currentStatus) {
      return res.status(400).json({
        success: false,
        message: "Order is already in the selected status.",
      });
    }

    const nextStatusIndex = linearStatuses.indexOf(orderStatus);
    const currentStatusIndex = linearStatuses.indexOf(currentStatus);

    if (nextStatusIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status supplied.",
      });
    }

    if (
      currentStatusIndex !== -1 &&
      nextStatusIndex < currentStatusIndex
    ) {
      return res.status(400).json({
        success: false,
        message: "Order status cannot move backwards.",
      });
    }

    // Prepare update object
    const updateData = {
      orderStatus,
      orderUpdateDate: new Date(),
    };

    // Set confirmation date and payment deadline when order is confirmed
    // Also reduce stock when order is confirmed
    if (orderStatus === "confirmed" && currentStatus !== "confirmed") {
      const confirmationDate = new Date();
      updateData.confirmationDate = confirmationDate;
      // Set payment deadline (configurable via env, default 3 days)
      const paymentDeadline = new Date(confirmationDate);
      const daysUntilDeadline = parseInt(process.env.PAYMENT_DEADLINE_DAYS || 3);
      paymentDeadline.setDate(paymentDeadline.getDate() + daysUntilDeadline);
      updateData.paymentDeadline = paymentDeadline;

      // Reduce stock when order is confirmed
      // Use transaction if available for atomicity
      let useTransaction = false;
      let session = null;
      
      try {
        session = await mongoose.startSession();
        await session.startTransaction();
        useTransaction = true;
      } catch (transactionError) {
        console.log("[Order Confirm] Transactions not available, using fallback method");
        useTransaction = false;
      }

      const updatedProducts = []; // Track products that had stock reduced
      
      try {
        if (order.cartItems && order.cartItems.length > 0) {
          for (const cartItem of order.cartItems) {
            const product = useTransaction 
              ? await Product.findById(cartItem.productId).session(session)
              : await Product.findById(cartItem.productId);
            
            if (!product) {
              if (useTransaction) await session.abortTransaction();
              return res.status(400).json({
                success: false,
                message: `Product not found: ${cartItem.productId}`,
              });
            }

            // Check if there's enough stock
            if (product.totalStock < cartItem.quantity) {
              if (useTransaction) await session.abortTransaction();
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for "${product.title}". Available: ${product.totalStock}, Requested: ${cartItem.quantity}`,
              });
            }

            // Reduce stock
            product.totalStock -= cartItem.quantity;
            if (useTransaction) {
              await product.save({ session });
            } else {
              await product.save();
            }
            
            // Track updated product for real-time notification
            updatedProducts.push({
              productId: product._id,
              product: product.toObject(),
              quantityReduced: cartItem.quantity,
            });
          }
        }

        if (useTransaction) {
          await session.commitTransaction();
        }
        
        // Emit real-time product updates to all clients (admin and users)
        const io = req.app.get("io");
        if (io && updatedProducts.length > 0) {
          updatedProducts.forEach(({ product, quantityReduced }) => {
            // Emit to admin room
            io.to("admin-room").emit("product-updated", {
              action: "stock-reduced",
              product: product,
              quantityReduced: quantityReduced,
              reason: "order-confirmed",
              orderId: order._id,
            });
            
            // Emit to all users (broadcast)
            io.emit("product-updated", {
              action: "stock-reduced",
              product: product,
              quantityReduced: quantityReduced,
              reason: "order-confirmed",
            });
          });
          console.log(`[Order Confirm] Emitted stock updates for ${updatedProducts.length} product(s)`);
        }
      } catch (stockError) {
        if (useTransaction && session) {
          try {
            await session.abortTransaction();
          } catch (abortError) {
            console.error("Error aborting transaction:", abortError);
          }
        }
        console.error("Error reducing stock on order confirmation:", stockError);
        return res.status(500).json({
          success: false,
          message: `Failed to confirm order due to stock update error: ${stockError.message || "Please try again."}`,
        });
      } finally {
        if (session) {
          try {
            session.endSession();
          } catch (endError) {
            console.error("Error ending session:", endError);
          }
        }
      }
    }

    // Automatically mark payment as paid only when the order is picked up
    if (orderStatus === "pickedUp") {
      updateData.paymentStatus = "paid";
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("userId", "userName email");

    // Automatically sync payment deadline to Google Calendar if it was just set
    if (updateData.paymentDeadline && updatedOrder?.userId) {
      // Get userId - handle both populated and non-populated cases
      const userId = updatedOrder.userId._id || updatedOrder.userId;
      console.log(`[Order Update] Triggering calendar sync for order ${updatedOrder._id}, user ${userId}`);
      // Sync in background, don't wait for it to complete
      syncSingleDeadlineToCalendar(userId, updatedOrder)
        .then(result => {
          if (result) {
            console.log(`[Order Update] ✅ Successfully triggered calendar sync for order ${updatedOrder._id}`);
          } else {
            console.log(`[Order Update] ℹ️ Calendar sync skipped for order ${updatedOrder._id} (user may not have calendar connected)`);
          }
        })
        .catch(err => {
          console.error(`[Order Update] ❌ Background calendar sync failed for order ${updatedOrder._id}:`, err.message);
        });
    }

    let note;

    if (orderStatus === "readyForPickup") {
      note = "Please proceed to the pickup counter with your receipt.";
    } else if (orderStatus === "pickedUp") {
      note = "We hope to serve you again soon.";
    }

    const recipientEmail =
      updatedOrder?.userId?.email ||
      updatedOrder?.addressInfo?.notes ||
      updatedOrder?.addressInfo?.email;

    if (recipientEmail) {
      const userName =
        updatedOrder?.userId?.userName ||
        updatedOrder?.addressInfo?.address ||
        "Customer";

      try {
        // When an admin confirms an order, send the full confirmation email with receipt
        if (orderStatus === "confirmed") {
          await sendOrderConfirmationEmail({
            to: recipientEmail,
            userName,
            orderNumber: updatedOrder._id,
            orderDate: updatedOrder.orderDate,
            totalAmount: updatedOrder.totalAmount,
            paymentMethod: updatedOrder.paymentMethod,
            cartItems: updatedOrder.cartItems,
            addressInfo: updatedOrder.addressInfo,
          });
        } else {
          await sendOrderStatusUpdateEmail({
            to: recipientEmail,
            userName,
            orderNumber: updatedOrder._id,
            newStatus: orderStatus,
            note,
          });
        }
      } catch (error) {
        console.error("Failed to send order email:", {
          error: error.message,
          orderId: updatedOrder?._id,
          orderStatus,
        });
      }
    }

    const io = req.app.get("io");
    if (io && updatedOrder?.userId?._id) {
      const statusLabels = {
        pending: "Pending",
        confirmed: "Confirmed",
        readyForPickup: "Ready for Pickup",
        pickedUp: "Picked up",
        cancelled: "Cancelled",
      };

      const humanReadableStatus = statusLabels[orderStatus] || orderStatus;

      io.to(`user-${updatedOrder.userId._id}`).emit("order-updated", {
        orderId: updatedOrder._id,
        newStatus: orderStatus,
        newStatusLabel: humanReadableStatus,
        userName: updatedOrder.userId.userName,
        timestamp: new Date().toISOString(),
        message: `Your order ${updatedOrder._id} is now ${humanReadableStatus}.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status is updated successfully!",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const archiveOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    // Only allow archiving cancelled or pickedUp orders
    if (order.orderStatus !== "pickedUp" && order.orderStatus !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled or picked-up orders can be archived!",
      });
    }

    await Order.findByIdAndUpdate(id, { isArchived: true });

    res.status(200).json({
      success: true,
      message: "Order archived successfully!",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const unarchiveOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    await Order.findByIdAndUpdate(id, { isArchived: false });

    res.status(200).json({
      success: true,
      message: "Order unarchived successfully!",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
  archiveOrder,
  unarchiveOrder,
};


