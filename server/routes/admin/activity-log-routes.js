const express = require("express");

const {
  getProductActivityLogs,
  getAllActivityLogs,
  getAdminActivityLogs,
  getActivitySummary,
} = require("../../controllers/admin/activity-log-controller");

const router = express.Router();

// Get all activity logs (with optional filters)
router.get("/all", getAllActivityLogs);

// Get activity summary/statistics
router.get("/summary", getActivitySummary);

// Get activity logs for a specific product
router.get("/product/:productId", getProductActivityLogs);

// Get activity logs by a specific admin
router.get("/admin/:adminId", getAdminActivityLogs);

module.exports = router;

