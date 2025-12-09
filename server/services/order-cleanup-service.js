const cron = require("node-cron");
const Order = require("../models/Order");
const Product = require("../models/Product");

/**
 * Scheduled job to delete orders that have passed the payment deadline
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

    console.log(`[Order Cleanup] Found ${expiredOrders.length} expired order(s) to delete`);

    // Restore product stock for each expired order before deletion
    for (const order of expiredOrders) {
      try {
        if (order.cartItems && order.cartItems.length > 0) {
          for (const cartItem of order.cartItems) {
            try {
              const product = await Product.findById(cartItem.productId);
              
              if (!product) {
                console.error(`[Order Cleanup] Product not found: ${cartItem.productId}`);
                continue;
              }

              // Restore the stock
              product.totalStock = (product.totalStock || 0) + cartItem.quantity;
              await product.save();
              console.log(`[Order Cleanup] Restored ${cartItem.quantity} units of stock for product ${product.title}`);
            } catch (error) {
              console.error(`[Order Cleanup] Error restoring stock for product ${cartItem.productId}:`, error);
            }
          }
        }

        // Delete the expired order
        await Order.deleteOne({ _id: order._id });
        console.log(`[Order Cleanup] Deleted expired order ${order._id} (deadline: ${order.paymentDeadline ? order.paymentDeadline.toISOString() : 'N/A'})`);
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

