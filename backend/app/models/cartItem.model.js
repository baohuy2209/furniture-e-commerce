const mongoose = require("mongoose");
const cartItemSchema = new mongoose.Schema(
  {
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
    },
    product_variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
    },
    discount_percent: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("CartItem", cartItemSchema);
