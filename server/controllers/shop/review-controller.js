const Review = require("../../models/Review");
const Product = require("../../models/Product");
const Order = require("../../models/Order");

const addProductReview = async (req, res) => {
  try {
    const { productId, userId, userName, reviewMessage, reviewValue } =
      req.body;

    const order = await Order.findOne({
      userId,
      "cartItems.productId": productId,
      orderStatus: { $in: ["pickedUp", "delivered"] },
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You need to purchase product to review it.",
      });
    }

    const checkExistingReview = await Review.findOne({
      productId,
      userId,
    });

    if (checkExistingReview) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product!",
      });
    }

    const newReview = new Review({
      productId,
      userId,
      userName,
      reviewMessage,
      reviewValue,
    });

    await newReview.save();

    // Calculate average review excluding hidden reviews
    const visibleReviews = await Review.find({ productId, isHidden: false });
    const totalReviewsLength = visibleReviews.length;
    const averageReview =
      totalReviewsLength > 0
        ? visibleReviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
          totalReviewsLength
        : 0;

    await Product.findByIdAndUpdate(productId, { averageReview });

    res.status(201).json({
      success: true,
      data: newReview,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Only return reviews that are not hidden (for customer-facing views)
    const reviews = await Review.find({ productId, isHidden: false }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = { addProductReview, getProductReviews };

