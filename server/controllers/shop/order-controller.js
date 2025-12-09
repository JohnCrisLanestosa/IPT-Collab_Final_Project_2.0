const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const { imageUploadUtil } = require("../../helpers/cloudinary");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    // Validate stock availability before creating the order
    if (cartItems && cartItems.length > 0) {
      for (const cartItem of cartItems) {
        try {
          const product = await Product.findById(cartItem.productId);
          
          if (!product) {
            return res.status(400).json({
              success: false,
              message: `Product not found: ${cartItem.productId}`,
            });
          }

          // Check if there's enough stock
          if (product.totalStock < cartItem.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for "${product.title}". Available: ${product.totalStock}, Requested: ${cartItem.quantity}`,
            });
          }
        } catch (error) {
          console.error(`Error validating stock for product ${cartItem.productId}:`, error);
          return res.status(400).json({
            success: false,
            message: `Error validating product stock: ${error.message}`,
          });
        }
      }
    }

    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
    });

    await newlyCreatedOrder.save();

    // Reduce product stock for each item in the order
    for (const cartItem of cartItems) {
      try {
        const product = await Product.findById(cartItem.productId);
        
        if (!product) {
          console.error(`Product not found: ${cartItem.productId}`);
          continue; // Skip if product not found, but don't fail the entire order
        }

        // Check if there's enough stock
        if (product.totalStock < cartItem.quantity) {
          console.error(`Insufficient stock for product ${product.title}. Available: ${product.totalStock}, Requested: ${cartItem.quantity}`);
          // Continue anyway - stock check should have been done before order creation
          // But we'll reduce what we can
        }

        // Reduce the stock (ensure it doesn't go below 0)
        product.totalStock = Math.max(0, product.totalStock - cartItem.quantity);
        await product.save();
      } catch (error) {
        console.error(`Error reducing stock for product ${cartItem.productId}:`, error);
        // Continue with other products even if one fails
      }
    }

    // Clear the user's cart after successful order creation
    await Cart.findOneAndDelete({ userId });

    // Populate order with user details for notification
    const populatedOrder = await Order.findById(newlyCreatedOrder._id)
      .populate("userId", "userName email")
      .exec();

    // Emit new order notification to admin room
    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("new-order", {
        orderId: populatedOrder._id,
        userId: populatedOrder.userId?._id,
        userName: populatedOrder.userId?.userName || "Unknown User",
        totalAmount: populatedOrder.totalAmount,
        orderStatus: populatedOrder.orderStatus,
        orderDate: populatedOrder.orderDate,
        cartItems: populatedOrder.cartItems,
        addressInfo: populatedOrder.addressInfo,
      });
    }

    res.status(201).json({
      success: true,
      orderId: newlyCreatedOrder._id,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { archived } = req.query;

    const query = { userId };
    
    // Filter by archived status if provided
    if (archived !== undefined) {
      query.isArchived = archived === "true";
    }

    const orders = await Order.find(query).sort({ orderDate: -1 });

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

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

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

const getOrderDeadlinesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // If userId === 'all' return deadlines for all users (admin use-case)
    const query = {};
    if (userId && userId !== "all") query.userId = userId;

    // Only include non-archived orders
    query.isArchived = false;

    const orders = await Order.find(query).select(
      "_id cartItems paymentDeadline orderStatus totalAmount"
    );

    const deadlines = orders
      .filter((o) => o.paymentDeadline)
      .map((o) => ({
        orderId: o._id,
        title: o.cartItems && o.cartItems.length > 0 ? o.cartItems[0].title : `Order ${o._id}`,
        deadline: o.paymentDeadline,
        status: o.orderStatus,
        totalAmount: o.totalAmount,
      }))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    res.status(200).json({ success: true, data: deadlines });
  } catch (e) {
    console.error("getOrderDeadlinesByUser error", e);
    res.status(500).json({ success: false, message: "Some error occurred!" });
  }
};

const submitPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    // Upload payment proof image to Cloudinary
    let paymentProofUrl = null;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const url = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await imageUploadUtil(url);
      paymentProofUrl = result.url;
    }

    // Update order with payment proof (payment status remains pending until admin confirms)
    order.paymentProof = paymentProofUrl;
    order.orderUpdateDate = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment proof submitted successfully!",
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

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    // Verify that the order belongs to the user
    // Handle both ObjectId and string comparisons
    const orderUserId = order.userId?.toString?.() || String(order.userId);
    const requestUserId = String(userId);
    
    if (orderUserId !== requestUserId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this order!",
      });
    }

    // Check if order can be cancelled (only pending, confirmed, or preparing orders can be cancelled)
    const cancellableStatuses = ["pending", "confirmed", "preparing"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      });
    }

    // Check if order is already cancelled
    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled!",
      });
    }

    // Update order status to cancelled
    order.orderStatus = "cancelled";
    order.orderUpdateDate = new Date();

    await order.save();

    // Restore product stock for each item in the cancelled order
    if (order.cartItems && order.cartItems.length > 0) {
      for (const cartItem of order.cartItems) {
        try {
          const product = await Product.findById(cartItem.productId);
          
          if (!product) {
            console.error(`Product not found: ${cartItem.productId}`);
            continue; // Skip if product not found
          }

          // Restore the stock
          product.totalStock = (product.totalStock || 0) + cartItem.quantity;
          await product.save();
        } catch (error) {
          console.error(`Error restoring stock for product ${cartItem.productId}:`, error);
          // Continue with other products even if one fails
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully!",
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

const restoreCancelledOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found!" });
    }

    if (order.orderStatus !== "cancelled") {
      return res.status(400).json({ success: false, message: "Only cancelled orders can be restored." });
    }

    // Try to re-reserve stock for the items
    if (order.cartItems && order.cartItems.length > 0) {
      for (const cartItem of order.cartItems) {
        try {
          const product = await Product.findById(cartItem.productId);
          if (!product) continue;
          // Reduce stock again (ensure it doesn't go below 0)
          product.totalStock = Math.max(0, (product.totalStock || 0) - cartItem.quantity);
          await product.save();
        } catch (err) {
          console.error(`Error restoring stock for product ${cartItem.productId}:`, err);
        }
      }
    }

    order.orderStatus = "pending";
    order.orderUpdateDate = new Date();
    await order.save();

    res.status(200).json({ success: true, message: "Order restored successfully.", data: order });
  } catch (e) {
    console.error("restoreCancelledOrder error", e);
    res.status(500).json({ success: false, message: "Some error occurred!" });
  }
};

const deleteCancelledOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found!" });
    }

    if (order.orderStatus !== "cancelled") {
      return res.status(400).json({ success: false, message: "Only cancelled orders can be deleted." });
    }

    await Order.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Cancelled order deleted permanently." });
  } catch (e) {
    console.error("deleteCancelledOrder error", e);
    res.status(500).json({ success: false, message: "Some error occurred!" });
  }
};

const archiveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    // Verify that the order belongs to the user
    if (order.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to archive this order!",
      });
    }

    // Only allow archiving successful (paid) or picked-up orders
    const canArchive = 
      order.orderStatus === "pickedUp" || 
      (order.paymentStatus === "paid" && order.orderStatus !== "pending" && order.orderStatus !== "confirmed");

    if (!canArchive) {
      return res.status(400).json({
        success: false,
        message: "Only successful (paid) or picked-up orders can be archived!",
      });
    }

    // Check if order is already archived
    if (order.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Order is already archived!",
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
    const { userId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    // Verify that the order belongs to the user
    if (order.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to unarchive this order!",
      });
    }

    // Check if order is already unarchived
    if (!order.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Order is not archived!",
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
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  submitPaymentProof,
  cancelOrder,
  archiveOrder,
  unarchiveOrder,
  restoreCancelledOrder,
  deleteCancelledOrder,
  getOrderDeadlinesByUser,
};

