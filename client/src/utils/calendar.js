/**
 * Utility functions for Google Calendar integration
 */

/**
 * Generates a Google Calendar event URL for payment deadline
 * @param {Object} orderDetails - Order details object
 * @returns {string} Google Calendar URL
 */
export const generatePaymentDeadlineCalendarUrl = (orderDetails) => {
  // Calculate deadline: use paymentDeadline if exists, otherwise calculate from orderDate + 3 days
  let deadline;
  if (orderDetails?.paymentDeadline) {
    deadline = new Date(orderDetails.paymentDeadline);
  } else if (orderDetails?.orderDate) {
    deadline = new Date(orderDetails.orderDate);
    deadline.setDate(deadline.getDate() + 3);
  } else {
    return null;
  }
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatGoogleDate = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  const startDate = formatGoogleDate(deadline);
  // End date is 1 hour after start (for calendar event duration)
  const endDate = formatGoogleDate(new Date(deadline.getTime() + 60 * 60 * 1000));

  // Event title
  const title = encodeURIComponent(
    `Payment Deadline - Order ${orderDetails._id?.substring(0, 8) || 'N/A'}`
  );

  // Event description
  const description = encodeURIComponent(
    `Payment Deadline Reminder\n\n` +
    `Order ID: ${orderDetails._id}\n` +
    `Order Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}\n` +
    `Total Amount: ₱${orderDetails.totalAmount}\n` +
    `Payment Method: ${orderDetails.paymentMethod || 'Cash'}\n` +
    `Payment Status: ${orderDetails.paymentStatus || 'Pending'}\n\n` +
    `Please submit your payment proof before the deadline to avoid order cancellation.\n\n` +
    `Order will be automatically canceled if payment proof is not submitted within 3 days.`
  );

  // Event location (order details page)
  const location = encodeURIComponent(
    window.location.origin + `/shop/orders`
  );

  // Build Google Calendar URL
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&` +
    `text=${title}&` +
    `dates=${startDate}/${endDate}&` +
    `details=${description}&` +
    `location=${location}`;

  return calendarUrl;
};

/**
 * Opens Google Calendar in a new window/tab
 * @param {Object} orderDetails - Order details object
 */
export const addToGoogleCalendar = (orderDetails) => {
  const calendarUrl = generatePaymentDeadlineCalendarUrl(orderDetails);
  if (calendarUrl) {
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  }
};

