const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartId: {
      type: String,
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: String,
        image: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    addressInfo: {
      addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
      address: String,
      city: String,
      pincode: String,
      phone: String,
      notes: String,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "readyForPickup", "pickedUp", "cancelled"],
      default: "pending",
    },
    paymentMethod: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentProof: {
      type: String,
      default: null,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    orderUpdateDate: {
      type: Date,
      default: Date.now,
    },
    confirmationDate: {
      type: Date,
      default: null,
    },
    paymentDeadline: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);

