const express = require("express");
const {
  getProfile,
  updateProfile,
} = require("../../controllers/admin/profile-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");
const { checkAdminOrSuperAdmin } = require("../../middleware/superadmin-middleware");

const router = express.Router();

// All routes require authentication and admin/superadmin role
router.use(authMiddleware);
router.use(checkAdminOrSuperAdmin);

// Get profile
router.get("/", getProfile);

// Update profile
router.put("/", updateProfile);

module.exports = router;

