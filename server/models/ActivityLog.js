const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true, // For faster queries
    },
    productTitle: {
      type: String,
      required: true,
    },
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["add", "edit", "archive", "unarchive"],
      required: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed, // Stores the actual changes made
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true, // For sorting by date
    },
  },
  { timestamps: true }
);

// Index for efficient querying
ActivityLogSchema.index({ productId: 1, timestamp: -1 });
ActivityLogSchema.index({ adminId: 1, timestamp: -1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);

