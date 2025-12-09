const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

// Create a transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const formatCurrency = (amount) => {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return amount;
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(numericAmount);
};

const formatDateTime = (dateInput) => {
  try {
    const date = new Date(dateInput);

    if (Number.isNaN(date.getTime())) {
      return dateInput;
    }

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateInput;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const transporter = createTransporter();

  // Construct the reset URL
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

  // Email HTML template
  const mailOptions = {
    from: `"BukSu EEU" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your BukSu EEU account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br>BukSu EEU Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} BukSu EEU. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${userName},

We received a request to reset your password for your BukSu EEU account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
BukSu EEU Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (email, userName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"BukSu EEU" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Successfully Reset",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Password Reset Successful</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <div class="success">
              Your password has been successfully reset.
            </div>
            <p>You can now log in to your BukSu EEU account with your new password.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>BukSu EEU Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} BukSu EEU. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return { success: false, error: error.message };
  }
};

const buildOrderItemsHtml = (cartItems = []) => {
  if (!cartItems.length) {
    return `<tr>
      <td colspan="3" style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
        No items recorded for this order.
      </td>
    </tr>`;
  }

  return cartItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.title}</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(
            Number(item.price) * Number(item.quantity || 1)
          )}</td>
        </tr>
      `
    )
    .join("");
};

const buildOrderItemsText = (cartItems = []) => {
  if (!cartItems.length) {
    return "- No items recorded for this order.";
  }

  return cartItems
    .map(
      (item) =>
        `- ${item.title} (Qty: ${item.quantity}) - ${formatCurrency(
          Number(item.price) * Number(item.quantity || 1)
        )}`
    )
    .join("\n");
};

const generateOrderReceiptPdf = ({
  orderNumber,
  orderDate,
  userName,
  cartItems,
  totalAmount,
  paymentMethod,
  addressInfo = {},
}) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const lineHeight = 14;

      const formatPeso = (value) => {
        const numericValue = Number(value) || 0;
        return `Peso ${numericValue.toFixed(2)}`;
      };
      const formatPhp = (value) => {
        const numericValue = Number(value) || 0;
        return `Php ${numericValue.toFixed(2)}`;
      };

      doc.font("Helvetica-Bold").fontSize(20).text("Payment Receipt", { align: "center" });
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(14).text("BukSu EEU", { align: "center" });

      doc.fontSize(10);
      doc.moveDown(2);

      const drawDetail = (label, value) => {
        doc.font("Helvetica-Bold").text(label, { continued: true });
        doc.font("Helvetica").text(` ${value || "N/A"}`);
      };

      drawDetail("Order ID:", orderNumber);
      drawDetail("Order Date:", formatDateTime(orderDate));

      doc.moveDown(1);
      doc.font("Helvetica-Bold").fontSize(12).text("Customer Information");
      doc.moveDown(0.7);
      doc.fontSize(10);

      const customerLines = [
        ["Name:", userName || addressInfo?.address],
        ["Email:", addressInfo?.notes],
        ["Phone:", addressInfo?.phone],
      ];

      customerLines.forEach(([label, value]) => {
        doc.font("Helvetica-Bold").text(label, { continued: true });
        doc.font("Helvetica").text(` ${value || "N/A"}`);
      });

      doc.moveDown(1.5);
      doc.moveTo(50, doc.y - 10).lineTo(545, doc.y - 10).stroke();

      doc.font("Helvetica-Bold").fontSize(12).text("Order Items");

      const headerY = doc.y + 6;

      doc.fontSize(10);
      doc.text("Item", 50, headerY);
      doc.text("Qty", 280, headerY);
      doc.text("Price", 360, headerY);
      doc.text("Total", 440, headerY);

      doc.moveTo(50, headerY + 12).lineTo(545, headerY + 12).stroke();

      let position = headerY + 24;
      doc.font("Helvetica").fontSize(9);

      if (cartItems && cartItems.length) {
        cartItems.forEach((item) => {
          if (position > 740) {
            doc.addPage();
            position = 50;
          }

          const itemTitle = item.title || "Product";
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const itemTotal = quantity * price;

          const itemColumnWidth = 200;
          const itemHeight = doc.heightOfString(itemTitle, {
            width: itemColumnWidth,
            align: "left",
          });

          doc.text(itemTitle, 50, position, { width: itemColumnWidth });
          doc.text(quantity.toString(), 280, position);
          doc.text(formatPeso(price), 360, position, { width: 70, align: "right" });
          doc.text(formatPeso(itemTotal), 440, position, { width: 70, align: "right" });

          position += Math.max(lineHeight, itemHeight);
        });
      } else {
        doc.text("No items", 50, position);
        position += lineHeight;
      }

      position += 10;
      doc.moveTo(50, position).lineTo(545, position).stroke();

      position += 16;
      doc.font("Helvetica-Bold").fontSize(11).text("Total Amount:", 340, position);
      doc.font("Helvetica").text(formatPhp(totalAmount), 440, position, { width: 70, align: "right" });

      position += 40;
      doc
        .font("Helvetica")
        .fontSize(9)
        .text("Thank you for your purchase!", 50, position, { width: 495, align: "center" });
      doc.text("This is a computer-generated receipt.", 50, position + 12, {
        width: 495,
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });

const sendOrderConfirmationEmail = async ({
  to,
  userName,
  orderNumber,
  orderDate,
  totalAmount,
  paymentMethod,
  cartItems,
  addressInfo,
}) => {
  const transporter = createTransporter();

  const formattedTotal = formatCurrency(totalAmount);
  const formattedDate = formatDateTime(orderDate);
  const receiptBuffer = await generateOrderReceiptPdf({
    orderNumber,
    orderDate,
    userName,
    cartItems,
    totalAmount,
    paymentMethod,
    addressInfo,
  });

  const mailOptions = {
    from: `"BukSu EEU" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; padding: 0; margin: 0; }
          .container { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
          .card { background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
          .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 32px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; }
          .content { padding: 32px; }
          .content h2 { margin-top: 0; font-size: 22px; color: #1d4ed8; }
          .summary { margin: 24px 0; }
          .summary div { margin-bottom: 12px; display: flex; justify-content: space-between; }
          .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          .footer { padding: 24px 32px; background-color: #f9fafb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Your order is confirmed!</h1>
              <p style="margin-top: 8px; font-size: 15px;">Reference: ${orderNumber}</p>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for ordering with BukSu EEU! We're getting everything ready and will keep you posted once your order is on the way.</p>
              <div class="summary">
                <div><strong>Order Date:</strong> <span>${formattedDate}</span></div>
                <div><strong>Payment Method:</strong> <span>${paymentMethod}</span></div>
                <div><strong>Total Amount:</strong> <span style="font-size: 18px; color: #2563eb;">${formattedTotal}</span></div>
              </div>
              <h2>Order Summary</h2>
              <table class="table">
                <thead>
                  <tr style="background-color: #eef2ff;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildOrderItemsHtml(cartItems)}
                  <tr>
                    <td colspan="2" style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;"><strong>Grand Total</strong></td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;"><strong>${formattedTotal}</strong></td>
                  </tr>
                </tbody>
              </table>
              <p style="margin-top: 24px;">We'll send you another update when your order is ready for pickup.</p>
              <p>If you have any questions, feel free to reply to this email.</p>
              <p style="margin-bottom: 0;">Warm regards,<br/>BukSu EEU Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} BukSu EEU. All rights reserved.</p>
              <p>This email was sent to you because you placed an order on our site.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${userName},

Thank you for ordering with BukSu EEU! Your order has been confirmed and is now being processed.

Order Reference: ${orderNumber}
Order Date: ${formattedDate}
Payment Method: ${paymentMethod}
Total Amount: ${formattedTotal}

Items:
${buildOrderItemsText(cartItems)}

We'll send you another update once your order is ready for pickup.

BukSu EEU Team
    `,
    attachments: [
      {
        filename: `receipt-${orderNumber}.pdf`,
        content: receiptBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

const sendOrderStatusUpdateEmail = async ({
  to,
  userName,
  orderNumber,
  newStatus,
  note,
}) => {
  const transporter = createTransporter();

  const readableStatus =
    newStatus === "readyForPickup"
      ? "ready for pickup"
      : newStatus === "pickedUp"
      ? "completed"
      : newStatus;

  const mailOptions = {
    from: `"BukSu EEU" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Order Update - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; padding: 0; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
          .card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 26px rgba(30, 64, 175, 0.1); overflow: hidden; }
          .header { background-color: #1d4ed8; color: white; padding: 28px; text-align: center; }
          .content { padding: 28px; }
          .badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; background-color: #2563eb; color: white; font-weight: 600; margin: 12px 0; }
          .note { margin-top: 16px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; color: #1f2937; }
          .footer { padding: 20px 28px; background-color: #f9fafb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h2 style="margin: 0;">Order Status Update</h2>
              <p style="margin: 8px 0 0;">Reference: ${orderNumber}</p>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>We have an update regarding your order.</p>
              <div class="badge">Status: ${readableStatus}</div>
              ${
                note
                  ? `<div class="note">
                      <strong>Next steps:</strong>
                      <p style="margin: 8px 0 0;">${note}</p>
                    </div>`
                  : ""
              }
              <p style="margin-top: 20px;">If you have any questions, just reply to this email and we’ll be happy to help.</p>
              <p style="margin-bottom: 0;">Warm regards,<br/>BukSu EEU Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} BukSu EEU. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${userName},

We have an update regarding your order ${orderNumber}.
Status: ${readableStatus}
${note ? `
Next steps:
${note}
` : ""}
If you have any questions, reply to this email.

BukSu EEU Team
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
};

