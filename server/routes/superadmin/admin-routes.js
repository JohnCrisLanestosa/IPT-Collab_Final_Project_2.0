const express = require("express");
const {
  getAllAdmins,
  getUserStatistics,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
  archiveAdmin,
  unarchiveAdmin,
} = require("../../controllers/superadmin/admin-management-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");
const { checkSuperAdmin } = require("../../middleware/superadmin-middleware");

const router = express.Router();

// All routes require authentication and superadmin role
router.use(authMiddleware);
router.use(checkSuperAdmin);

// Get all admins
router.get("/", getAllAdmins);

// Get user statistics
router.get("/statistics", getUserStatistics);

// Create new admin
router.post("/create", createAdmin);

// Update admin
router.put("/:id", updateAdmin);

// Delete admin
router.delete("/:id", deleteAdmin);

// Archive admin
router.patch("/:id/archive", archiveAdmin);

// Unarchive admin
router.patch("/:id/unarchive", unarchiveAdmin);

// Toggle admin status
router.patch("/:id/toggle-status", toggleAdminStatus);

module.exports = router;

