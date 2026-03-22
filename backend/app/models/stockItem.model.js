const mongoose = require("mongoose");
const stockItemSchema = new mongoose.Schema(
  {
    product_variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    quantity_on_hand: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity_reserved: {
      type: Number,
      required: true,
      default: 0,
    },
    reorder_point: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("StockItem", stockItemSchema);
