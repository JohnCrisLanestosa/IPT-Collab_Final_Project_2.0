const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    description: String,
    category: String,
    price: Number,
    totalStock: Number,
    averageReview: Number,
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Two-Phase Locking fields
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    lockedByName: {
      type: String,
      default: null,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
