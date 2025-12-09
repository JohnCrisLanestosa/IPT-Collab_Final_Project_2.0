const express = require("express");

const {
  getAllActivityLogs,
  getAdminActivityLogs,
  getActivitySummary,
  getProductActivityLogs,
} = require("../../controllers/admin/activity-log-controller");

const router = express.Router();

// Superadmin routes for monitoring admin activities
// These are the same endpoints but organized under superadmin namespace

// Get all activity logs with advanced filtering
router.get("/all", getAllActivityLogs);

// Get comprehensive activity summary/statistics
router.get("/summary", getActivitySummary);

// Monitor a specific admin's activities
router.get("/monitor-admin/:adminId", getAdminActivityLogs);

// View complete history of a product
router.get("/product-history/:productId", getProductActivityLogs);

module.exports = router;



