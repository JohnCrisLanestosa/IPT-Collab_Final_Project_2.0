const express = require("express");
const {
  getProductReviewsForAdmin,
  hideReview,
  unhideReview,
} = require("../../controllers/admin/review-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/:productId", getProductReviewsForAdmin);
router.put("/hide/:reviewId", hideReview);
router.put("/unhide/:reviewId", unhideReview);

module.exports = router;

