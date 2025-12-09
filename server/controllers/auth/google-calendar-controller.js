const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Order = require("../../models/Order");

const oauth2ClientFactory = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_CALLBACK_URL } = process.env;
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALENDAR_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL
  );
};

// Redirects user to Google's consent screen for calendar access
const generateCalendarAuthUrl = (req, res) => {
  try {
    const oauth2Client = oauth2ClientFactory();
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
    });

    // Redirect user to consent URL
    res.redirect(url);
  } catch (e) {
    console.error("generateCalendarAuthUrl error", e);
    res.status(500).json({ success: false, message: "Failed to generate Google consent URL" });
  }
};

// Callback that exchanges code for tokens and persists to user
const googleCalendarCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code");

    const oauth2Client = oauth2ClientFactory();
    const { tokens } = await oauth2Client.getToken(code);

    // Identify user from our JWT cookie
    const token = req.cookies?.token;
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.warn("Failed to decode JWT from cookie during calendar callback", err.message);
      }
    }

    if (!userId) {
      // If no cookie, try state parameter (optional)
      const state = req.query.state;
      try {
        if (state) {
          const decodedState = jwt.verify(state, process.env.JWT_SECRET);
          userId = decodedState.id;
        }
      } catch (err) {
        // ignore
      }
    }

    if (!userId) {
      console.error("No authenticated user found to attach Google tokens");
      return res.redirect(`${process.env.CLIENT_URL}/shop/account?calendar=failed`);
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/shop/account?calendar=failed`);
    }

    // Persist tokens (refresh token might be undefined if already granted before)
    if (tokens.access_token) user.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token;
    if (tokens.expiry_date) user.googleTokenExpiry = new Date(tokens.expiry_date);
    user.googleCalendarEnabled = true;
    await user.save();

    // Redirect back to client with success
    res.redirect(`${process.env.CLIENT_URL}/shop/account?calendar=connected`);
  } catch (e) {
    console.error("googleCalendarCallback error", e);
    res.redirect(`${process.env.CLIENT_URL}/shop/account?calendar=failed`);
  }
};

/**
 * Helper function to sync a single order's payment deadline to Google Calendar
 * This is called automatically when a payment deadline is set
 * @param {string} userId - User ID
 * @param {Object} order - Order object with paymentDeadline
 * @returns {Promise<boolean>} - Returns true if synced successfully, false otherwise
 */
const syncSingleDeadlineToCalendar = async (userId, order) => {
  try {
    if (!order.paymentDeadline) {
      console.log(`[Calendar Sync] Order ${order._id} has no payment deadline, skipping`);
      return false; // No deadline to sync
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`[Calendar Sync] User ${userId} not found for calendar sync`);
      return false;
    }

    // Check if user has Google Calendar connected
    if (!user.googleRefreshToken && !user.googleAccessToken) {
      console.log(`[Calendar Sync] User ${userId} hasn't connected Google Calendar yet, skipping`);
      return false;
    }

    console.log(`[Calendar Sync] Starting sync for order ${order._id} to user ${userId}'s calendar`);

    const oauth2Client = oauth2ClientFactory();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Refresh token if needed
    try {
      const tokenResponse = await oauth2Client.getAccessToken();
      if (tokenResponse?.token) {
        user.googleAccessToken = tokenResponse.token;
        await user.save();
        console.log(`[Calendar Sync] Refreshed access token for user ${userId}`);
      }
    } catch (err) {
      console.warn(`[Calendar Sync] Could not refresh access token for calendar sync: ${err.message}`);
      // Continue anyway, might still work
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get or create calendar for payment deadlines
    let calendarId = user.googleCalendarId;
    
    if (!calendarId) {
      console.log(`[Calendar Sync] Creating new calendar for user ${userId}`);
      // Create a new calendar for payment deadlines
      const calendarResource = {
        summary: "BukSu EEU - Payment Deadlines",
        description: "Payment deadlines for your orders",
        timeZone: "Asia/Manila",
      };

      const createdCalendar = await calendar.calendars.insert({
        requestBody: calendarResource,
      });

      calendarId = createdCalendar.data.id;
      console.log(`[Calendar Sync] Created calendar ${calendarId} for user ${userId}`);
      
      // Make calendar publicly readable for embedding
      try {
        await calendar.acl.insert({
          calendarId: calendarId,
          requestBody: {
            role: "reader",
            scope: {
              type: "default",
            },
          },
        });
        console.log(`[Calendar Sync] Set public read access for calendar ${calendarId}`);
      } catch (aclError) {
        console.warn(`[Calendar Sync] Could not set calendar ACL: ${aclError.message}`);
      }
      
      // Save calendar ID to user
      user.googleCalendarId = calendarId;
      await user.save();
    }

    // Check if event already exists for this order
    const existingEvents = await calendar.events.list({
      calendarId: calendarId,
      maxResults: 2500,
      q: `Order ID: ${order._id}`,
    });

    const orderIdStr = order._id.toString();
    const eventExists = existingEvents.data.items?.some(e => 
      e.description?.includes(`Order ID: ${orderIdStr}`)
    );

    if (eventExists) {
      console.log(`[Calendar Sync] Event already exists for order ${order._id}, skipping`);
      return true;
    }

    // Create event
    const title = order.cartItems && order.cartItems.length > 0 
      ? order.cartItems[0].title 
      : `Order ${order._id.toString().substring(0, 8)}`;

    const event = {
      summary: `💰 Payment Due: ${title}`,
      description: `Payment Deadline Reminder\n\nOrder ID: ${order._id}\nTotal Amount: ₱${order.totalAmount || 0}\nStatus: ${order.orderStatus}\n\nPlease submit your payment proof before the deadline.`,
      start: {
        dateTime: new Date(order.paymentDeadline).toISOString(),
        timeZone: "Asia/Manila",
      },
      end: {
        dateTime: new Date(new Date(order.paymentDeadline).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: "Asia/Manila",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 1440 }, // 1 day before
          { method: "popup", minutes: 60 }, // 1 hour before
          { method: "popup", minutes: 10 }, // 10 minutes before
        ],
      },
      colorId: "11", // Red color for visibility
    };

    const createdEvent = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    console.log(`[Calendar Sync] ✅ Successfully created calendar event for order ${order._id}: ${createdEvent.data.htmlLink}`);
    return true;
  } catch (error) {
    // Log error but don't throw - we don't want to break the order update flow
    console.error(`[Calendar Sync] ❌ Failed to sync payment deadline for order ${order._id}:`, error.message, error.stack);
    return false;
  }
};

// Sync user order deadlines into their Google Calendar
const syncOrderDeadlinesToCalendar = async (req, res) => {
  try {
    // Identify user from JWT cookie
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.googleRefreshToken && !user.googleAccessToken) {
      return res.status(400).json({ success: false, message: "No Google Calendar credentials found. Please connect your Google Calendar first." });
    }

    const oauth2Client = oauth2ClientFactory();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Ensure token is fresh
    try {
      const tokenResponse = await oauth2Client.getAccessToken();
      if (tokenResponse?.token) {
        user.googleAccessToken = tokenResponse.token;
        await user.save();
      }
    } catch (err) {
      console.warn("Could not refresh access token automatically", err.message);
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Fetch deadlines
    const orders = await Order.find({ userId: user._id, isArchived: false }).select("_id paymentDeadline totalAmount orderStatus cartItems");
    const deadlines = orders.filter(o => o.paymentDeadline);

    const created = [];

    for (const o of deadlines) {
      const title = o.cartItems && o.cartItems.length > 0 ? o.cartItems[0].title : `Order ${o._id}`;
      const event = {
        summary: `Payment due: ${title}`,
        description: `Order ID: ${o._id}\nAmount: ${o.totalAmount}\nStatus: ${o.orderStatus}`,
        start: {
          dateTime: new Date(o.paymentDeadline).toISOString(),
        },
        end: {
          dateTime: new Date(new Date(o.paymentDeadline).getTime() + 60 * 60 * 1000).toISOString(),
        },
      };

      try {
        await calendar.events.insert({ calendarId: "primary", requestBody: event });
        created.push(o._id);
      } catch (err) {
        console.error("Failed to create calendar event for order", o._id, err.message || err);
      }
    }

    res.json({ success: true, createdCount: created.length, createdOrderIds: created });
  } catch (e) {
    console.error("syncOrderDeadlinesToCalendar error", e);
    res.status(500).json({ success: false, message: "Failed to sync deadlines" });
  }
};

// Get or create a public calendar for payment deadlines and return embed URL
const getCalendarEmbedUrl = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.googleRefreshToken && !user.googleAccessToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Google Calendar not connected",
        needsAuth: true,
        authUrl: `${process.env.SERVER_URL || "http://localhost:5000"}/api/auth/calendar/connect`
      });
    }

    const oauth2Client = oauth2ClientFactory();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Refresh token if needed
    try {
      const tokenResponse = await oauth2Client.getAccessToken();
      if (tokenResponse?.token) {
        user.googleAccessToken = tokenResponse.token;
        await user.save();
      }
    } catch (err) {
      console.warn("Could not refresh access token", err.message);
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Check if user has a dedicated calendar for payment deadlines
    let calendarId = user.googleCalendarId;
    
    if (!calendarId) {
      // Create a new calendar for payment deadlines
      const calendarResource = {
        summary: "BukSu EEU - Payment Deadlines",
        description: "Payment deadlines for your orders",
        timeZone: "Asia/Manila",
      };

      const createdCalendar = await calendar.calendars.insert({
        requestBody: calendarResource,
      });

      calendarId = createdCalendar.data.id;
      
      // Make calendar publicly readable for embedding
      try {
        await calendar.calendars.patch({
          calendarId: calendarId,
          requestBody: {
            summary: "BukSu EEU - Payment Deadlines",
            description: "Payment deadlines for your orders",
            timeZone: "Asia/Manila",
          },
        });
        
        // Set public access
        await calendar.acl.insert({
          calendarId: calendarId,
          requestBody: {
            role: "reader",
            scope: {
              type: "default",
            },
          },
        });
      } catch (aclError) {
        console.warn("Could not set calendar ACL, but calendar was created:", aclError.message);
      }

      // Save calendar ID to user
      user.googleCalendarId = calendarId;
      await user.save();
    }

    // Sync all deadlines to the calendar
    const orders = await Order.find({ 
      userId: user._id, 
      isArchived: false,
      paymentDeadline: { $exists: true, $ne: null },
      orderStatus: { $in: ["pending", "confirmed"] }
    }).select("_id paymentDeadline totalAmount orderStatus cartItems");

    // Get existing events to avoid duplicates
    const existingEvents = await calendar.events.list({
      calendarId: calendarId,
      maxResults: 2500,
    });

    const existingEventIds = new Set(
      existingEvents.data.items?.map(e => e.description?.match(/Order ID: ([^\n]+)/)?.[1]) || []
    );

    // Create/update events for each deadline
    for (const order of orders) {
      if (existingEventIds.has(order._id.toString())) {
        continue; // Skip if event already exists
      }

      const title = order.cartItems && order.cartItems.length > 0 
        ? order.cartItems[0].title 
        : `Order ${order._id.toString().substring(0, 8)}`;

      const event = {
        summary: `Payment Deadline - ${title}`,
        description: `Payment Deadline Reminder\n\nOrder ID: ${order._id}\nTotal Amount: ₱${order.totalAmount || 0}\nStatus: ${order.orderStatus}\n\nPlease submit your payment proof before the deadline.`,
        start: {
          dateTime: new Date(order.paymentDeadline).toISOString(),
          timeZone: "Asia/Manila",
        },
        end: {
          dateTime: new Date(new Date(order.paymentDeadline).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: "Asia/Manila",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 1440 }, // 1 day before
            { method: "popup", minutes: 60 }, // 1 hour before
          ],
        },
      };

      try {
        await calendar.events.insert({
          calendarId: calendarId,
          requestBody: event,
        });
      } catch (err) {
        console.error("Failed to create calendar event for order", order._id, err.message);
      }
    }

    // Generate embed URL
    const embedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=Asia%2FManila`;

    res.json({
      success: true,
      data: {
        calendarId,
        embedUrl,
        needsAuth: false,
      },
    });
  } catch (e) {
    console.error("getCalendarEmbedUrl error", e);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get calendar embed URL",
      error: e.message 
    });
  }
};

// Manual sync endpoint - forces a refresh of all deadlines to Google Calendar
const manualSyncDeadlines = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.googleRefreshToken && !user.googleAccessToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Please connect your Google Calendar first",
        needsAuth: true
      });
    }

    console.log(`[Manual Sync] Starting manual sync for user ${user._id}`);

    // Fetch all orders with deadlines
    const orders = await Order.find({ 
      userId: user._id, 
      isArchived: false,
      paymentDeadline: { $exists: true, $ne: null },
      orderStatus: { $in: ["pending", "confirmed"] }
    }).select("_id paymentDeadline totalAmount orderStatus cartItems");

    console.log(`[Manual Sync] Found ${orders.length} orders with deadlines for user ${user._id}`);

    let successCount = 0;
    let failCount = 0;

    // Sync each order
    for (const order of orders) {
      const result = await syncSingleDeadlineToCalendar(user._id, order);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`[Manual Sync] Completed: ${successCount} succeeded, ${failCount} failed`);

    res.json({
      success: true,
      message: `Synced ${successCount} of ${orders.length} deadlines to your Google Calendar`,
      data: {
        totalOrders: orders.length,
        successCount,
        failCount,
      }
    });
  } catch (e) {
    console.error("[Manual Sync] Error:", e);
    res.status(500).json({ 
      success: false, 
      message: "Failed to sync deadlines to Google Calendar",
      error: e.message 
    });
  }
};

module.exports = {
  generateCalendarAuthUrl,
  googleCalendarCallback,
  syncOrderDeadlinesToCalendar,
  getCalendarEmbedUrl,
  syncSingleDeadlineToCalendar,
  manualSyncDeadlines,
};
