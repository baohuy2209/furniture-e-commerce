const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cart_status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    total_item: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Cart", cartSchema);
