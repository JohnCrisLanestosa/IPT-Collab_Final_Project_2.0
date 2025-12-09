const Order = require("../../models/Order");

/**
 * Generate iCal calendar feed for user's payment deadlines
 * This allows users to subscribe to their deadlines in Google Calendar
 */
const generateCalendarFeed = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find all orders with payment deadlines (including expired for calendar visibility)
    const orders = await Order.find({
      userId,
      isArchived: false,
      paymentDeadline: { $exists: true, $ne: null },
      orderStatus: { $in: ["pending", "confirmed"] }, // Include both pending and confirmed
    }).select("_id cartItems paymentDeadline orderDate totalAmount paymentMethod orderStatus");

    // Generate iCal content
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BukSu EEU//Payment Deadlines//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Payment Deadlines - BukSu EEU
X-WR-CALDESC:Payment deadlines for your orders
X-WR-TIMEZONE:Asia/Manila
`;

    orders.forEach((order) => {
      const deadline = new Date(order.paymentDeadline);
      const orderDate = new Date(order.orderDate || deadline);
      
      // Format dates for iCal (YYYYMMDDTHHMMSSZ)
      const formatDate = (date) => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        const seconds = String(date.getUTCSeconds()).padStart(2, "0");
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
      };

      const startDate = formatDate(deadline);
      // End date is 1 hour after start
      const endDate = formatDate(new Date(deadline.getTime() + 60 * 60 * 1000));

      // Escape special characters for iCal
      const escapeText = (text) => {
        return String(text || "")
          .replace(/\\/g, "\\\\")
          .replace(/;/g, "\\;")
          .replace(/,/g, "\\,")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "");
      };

      const title = order.cartItems && order.cartItems.length > 0
        ? order.cartItems[0].title || `Order ${order._id.toString().substring(0, 8)}`
        : `Order ${order._id.toString().substring(0, 8)}`;

      const description = `Payment Deadline Reminder\n\n` +
        `Order ID: ${order._id}\n` +
        `Order Date: ${orderDate.toLocaleDateString()}\n` +
        `Total Amount: ₱${order.totalAmount || 0}\n` +
        `Payment Method: ${order.paymentMethod || "Cash"}\n\n` +
        `Please submit your payment proof before the deadline to avoid order cancellation.\n\n` +
        `Order will be automatically canceled if payment proof is not submitted within 3 days.`;

      const uid = `payment-deadline-${order._id}@buksu-eeu`;

      icalContent += `BEGIN:VEVENT
UID:${uid}
DTSTART:${startDate}
DTEND:${endDate}
DTSTAMP:${formatDate(new Date())}
SUMMARY:${escapeText(`Payment Deadline - ${title}`)}
DESCRIPTION:${escapeText(description)}
LOCATION:BukSu EEU
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
    });

    icalContent += `END:VCALENDAR`;

    // Set headers for iCal file
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="payment-deadlines-${userId}.ics"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.send(icalContent);
  } catch (error) {
    console.error("generateCalendarFeed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate calendar feed",
    });
  }
};

/**
 * Get calendar subscription URL
 */
const getCalendarSubscriptionUrl = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Generate the calendar feed URL
    const baseUrl = process.env.SERVER_URL || "http://localhost:5000";
    const calendarUrl = `${baseUrl}/api/shop/order/calendar/${userId}/feed.ics`;

    res.status(200).json({
      success: true,
      data: {
        calendarUrl,
        googleCalendarUrl: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(calendarUrl)}`,
        instructions: "Copy the calendar URL and add it to Google Calendar as a calendar subscription.",
      },
    });
  } catch (error) {
    console.error("getCalendarSubscriptionUrl error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get calendar subscription URL",
    });
  }
};

module.exports = {
  generateCalendarFeed,
  getCalendarSubscriptionUrl,
};

