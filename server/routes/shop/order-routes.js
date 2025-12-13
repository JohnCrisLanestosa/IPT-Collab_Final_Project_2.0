const express = require("express");

const {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  getOrderDeadlinesByUser,
  submitPaymentProof,
  cancelOrder,
  archiveOrder,
  unarchiveOrder,
  restoreCancelledOrder,
  deleteCancelledOrder,
} = require("../../controllers/shop/order-controller");

const { syncOrderDeadlinesToCalendar } = require("../../controllers/auth/google-calendar-controller");
const { generateCalendarFeed, getCalendarSubscriptionUrl } = require("../../controllers/shop/calendar-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const { upload } = require("../../helpers/cloudinary");

const router = express.Router();

router.post("/create", authMiddleware, createOrder);
router.get("/list", authMiddleware, getAllOrdersByUser);
router.get("/deadlines", authMiddleware, getOrderDeadlinesByUser);
router.get("/calendar/feed.ics", authMiddleware, generateCalendarFeed);
router.get("/calendar/subscribe", authMiddleware, getCalendarSubscriptionUrl);
router.post("/sync-to-calendar", authMiddleware, syncOrderDeadlinesToCalendar);
router.get("/details/:id", authMiddleware, getOrderDetails);
router.post("/submit-payment-proof/:id", authMiddleware, upload.single("paymentProof"), submitPaymentProof);
router.post("/cancel/:id", authMiddleware, cancelOrder);
router.post("/archive/:id", authMiddleware, archiveOrder);
router.post("/unarchive/:id", authMiddleware, unarchiveOrder);
router.post("/restore/:id", authMiddleware, restoreCancelledOrder);
router.post("/delete/:id", authMiddleware, deleteCancelledOrder);

module.exports = router;

