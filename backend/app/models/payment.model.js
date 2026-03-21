const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    order_item_shipping_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItemShipping",
    },
    payment_method: {
      type: String,
      enum: ["cod", "momo", "bank_transfer"],
      defeault: "cod",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paid_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Payment", paymentSchema);
