const cron = require("node-cron");
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

/**
 * Scheduled job to cancel orders that have passed the payment deadline
 * without payment proof submission.
 * 
 * Runs every hour to check for expired orders.
 */
const cleanupExpiredOrders = async () => {
  try {
    const now = new Date();
    
    // Find orders that:
    // 1. Have passed the payment deadline (and paymentDeadline exists)
    // 2. Still have paymentStatus === "pending" (not "paid" or "failed")
    // 3. Have no payment proof submitted (paymentProof is null or empty)
    // 4. Are not already cancelled or archived
    const expiredOrders = await Order.find({
      paymentDeadline: { $exists: true, $ne: null, $lt: now },
      paymentStatus: "pending",
      $or: [
        { paymentProof: { $exists: false } },
        { paymentProof: null },
        { paymentProof: "" }
      ],
      orderStatus: { $ne: "cancelled" },
      isArchived: false,
    });

    if (expiredOrders.length === 0) {
      console.log(`[Order Cleanup] No expired orders found at ${now.toISOString()}`);
      return;
    }

    console.log(`[Order Cleanup] Found ${expiredOrders.length} expired order(s) to cancel`);

    // Mark expired orders as cancelled and restore stock
    // Only restore stock if the order was confirmed (stock was reduced on confirmation)
    // Note: paymentDeadline is only set when order is confirmed, so expired orders should always be confirmed
    for (const order of expiredOrders) {
      try {
        // Double-check: only restore stock if order was confirmed (stock was reduced on confirmation)
        const confirmedStatuses = ["confirmed", "readyForPickup", "pickedUp"];
        const wasConfirmed = confirmedStatuses.includes(order.orderStatus);
        
        const restoredProducts = []; // Track products that had stock restored
        
        if (wasConfirmed && order.cartItems && order.cartItems.length > 0) {
          // Use transaction if available for atomicity
          let useTransaction = false;
          let session = null;
          
          try {
            session = await mongoose.startSession();
            await session.startTransaction();
            useTransaction = true;
          } catch (transactionError) {
            console.log("[Order Cleanup] Transactions not available, using fallback method");
            useTransaction = false;
          }
          
          try {
            for (const cartItem of order.cartItems) {
              try {
                const product = useTransaction 
                  ? await Product.findById(cartItem.productId).session(session)
                  : await Product.findById(cartItem.productId);
                
                if (!product) {
                  console.error(`[Order Cleanup] Product not found: ${cartItem.productId}`);
                  continue;
                }

                // Restore the stock
                product.totalStock = (product.totalStock || 0) + cartItem.quantity;
                if (useTransaction) {
                  await product.save({ session });
                } else {
                  await product.save();
                }
                
                restoredProducts.push({
                  productId: product._id,
                  product: product.toObject(),
                  quantityRestored: cartItem.quantity,
                });
                
                console.log(`[Order Cleanup] Restored ${cartItem.quantity} units of stock for product ${product.title}`);
              } catch (error) {
                console.error(`[Order Cleanup] Error restoring stock for product ${cartItem.productId}:`, error);
              }
            }
            
            if (useTransaction) {
              await session.commitTransaction();
            }
          } catch (error) {
            if (useTransaction && session) {
              try {
                await session.abortTransaction();
              } catch (abortError) {
                console.error("Error aborting transaction:", abortError);
              }
            }
            console.error(`[Order Cleanup] Error restoring stock for order ${order._id}:`, error);
          } finally {
            if (session) {
              try {
                session.endSession();
              } catch (endError) {
                console.error("Error ending session:", endError);
              }
            }
          }
        } else if (!wasConfirmed) {
          console.log(`[Order Cleanup] Skipping stock restoration for order ${order._id} - order was not confirmed (status: ${order.orderStatus})`);
        }

        // Mark order as cancelled with reason
        order.orderStatus = "cancelled";
        order.cancellationReason = "Cancelled due to failure to pay";
        order.orderUpdateDate = new Date();
        await order.save();
        
        console.log(`[Order Cleanup] Cancelled expired order ${order._id} (deadline: ${order.paymentDeadline ? order.paymentDeadline.toISOString() : 'N/A'})`);
        
        // Note: Socket.IO events for stock updates would need the io instance
        // which is not available in this service. Stock updates will be reflected
        // when products are fetched next time.
      } catch (error) {
        console.error(`[Order Cleanup] Error processing expired order ${order._id}:`, error);
      }
    }

    console.log(`[Order Cleanup] Successfully processed ${expiredOrders.length} expired order(s) at ${now.toISOString()}`);
  } catch (error) {
    console.error("[Order Cleanup] Error in cleanupExpiredOrders:", error);
  }
};

/**
 * Start the scheduled cleanup job.
 * Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
 */
const startOrderCleanupJob = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", cleanupExpiredOrders, {
    scheduled: true,
    timezone: "Asia/Manila", // Adjust timezone as needed
  });

  console.log("[Order Cleanup] Scheduled job started. Will run every hour to check for expired orders.");
  
  // Run immediately on startup to clean up any orders that expired while server was down
  cleanupExpiredOrders();
};

module.exports = {
  startOrderCleanupJob,
  cleanupExpiredOrders, // Export for manual testing if needed
};

