require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const authRouter = require("./routes/auth/auth-routes");
const googleAuthRouter = require("./routes/auth/google-auth-routes");
const googleCalendarRouter = require("./routes/auth/google-calendar-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const adminProfileRouter = require("./routes/admin/profile-routes");
const adminActivityLogRouter = require("./routes/admin/activity-log-routes");
const superAdminRouter = require("./routes/superadmin/admin-routes");
const superAdminReportRouter = require("./routes/superadmin/report-routes");
const superAdminActivityLogRouter = require("./routes/superadmin/activity-log-routes");

const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");

const commonFeatureRouter = require("./routes/common/feature-routes");
const { startOrderCleanupJob } = require("./services/order-cleanup-service");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log(error));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());


// Session configuration for Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/auth", googleAuthRouter);
app.use("/api/auth", googleCalendarRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/profile", adminProfileRouter);
app.use("/api/admin/activity-logs", adminActivityLogRouter);
app.use("/api/superadmin/admins", superAdminRouter);
app.use("/api/superadmin/reports", superAdminReportRouter);
app.use("/api/superadmin/activity-logs", superAdminActivityLogRouter);

app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);

app.use("/api/common/feature", commonFeatureRouter);

// Create HTTP server
const server = require("http").createServer(app);

// Set up Socket.IO
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store io instance globally so controllers can access it
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join admin room when admin connects
  socket.on("join-admin-room", () => {
    socket.join("admin-room");
    const roomSize = io.sockets.adapter.rooms.get("admin-room")?.size || 0;
    console.log(`Admin ${socket.id} joined admin room (total: ${roomSize})`);
    
    // Send confirmation back to client
    socket.emit("admin-room-joined", {
      success: true,
      socketId: socket.id,
      roomSize: roomSize
    });
  });

  socket.on("register-user", (userId) => {
    if (!userId) {
      return;
    }
    socket.join(`user-${userId}`);
    socket.data.userId = userId;
    console.log(`User ${socket.id} joined room user-${userId}`);
  });

  socket.on("disconnect", () => {
    // Leave all rooms to prevent memory leaks
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) { // Don't leave the default room (socket.id)
        socket.leave(room);
      }
    });
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
  // Start the order cleanup scheduled job
  startOrderCleanupJob();
});
