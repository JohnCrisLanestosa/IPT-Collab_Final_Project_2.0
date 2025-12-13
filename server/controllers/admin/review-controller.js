const Review = require("../../models/Review");
const Product = require("../../models/Product");

// Get all reviews for a product (including hidden ones for admin)
const getProductReviewsForAdmin = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
    });
  }
};

// Hide a review
const hideReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found!",
      });
    }

    review.isHidden = true;
    await review.save();

    // Recalculate average review (excluding hidden reviews)
    const visibleReviews = await Review.find({
      productId: review.productId,
      isHidden: false,
    });
    const totalReviewsLength = visibleReviews.length;
    const averageReview =
      totalReviewsLength > 0
        ? visibleReviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
          totalReviewsLength
        : 0;

    await Product.findByIdAndUpdate(review.productId, { averageReview });

    res.status(200).json({
      success: true,
      message: "Review hidden successfully",
      data: review,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error hiding review",
    });
  }
};

// Unhide a review
const unhideReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found!",
      });
    }

    review.isHidden = false;
    await review.save();

    // Recalculate average review (excluding hidden reviews)
    const visibleReviews = await Review.find({
      productId: review.productId,
      isHidden: false,
    });
    const totalReviewsLength = visibleReviews.length;
    const averageReview =
      totalReviewsLength > 0
        ? visibleReviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
          totalReviewsLength
        : 0;

    await Product.findByIdAndUpdate(review.productId, { averageReview });

    res.status(200).json({
      success: true,
      message: "Review unhidden successfully",
      data: review,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error unhiding review",
    });
  }
};

module.exports = {
  getProductReviewsForAdmin,
  hideReview,
  unhideReview,
};

