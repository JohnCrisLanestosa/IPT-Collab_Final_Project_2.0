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

const { upload } = require("../../helpers/cloudinary");

const router = express.Router();

router.post("/create", createOrder);
router.get("/list/:userId", getAllOrdersByUser);
router.get("/deadlines/:userId", getOrderDeadlinesByUser);
router.get("/calendar/:userId/feed.ics", generateCalendarFeed);
router.get("/calendar/:userId/subscribe", getCalendarSubscriptionUrl);
router.post("/sync-to-calendar", syncOrderDeadlinesToCalendar);
router.get("/details/:id", getOrderDetails);
router.post("/submit-payment-proof/:id", upload.single("paymentProof"), submitPaymentProof);
router.post("/cancel/:id", cancelOrder);
router.post("/archive/:id", archiveOrder);
router.post("/unarchive/:id", unarchiveOrder);
router.post("/restore/:id", restoreCancelledOrder);
router.post("/delete/:id", deleteCancelledOrder);

module.exports = router;

