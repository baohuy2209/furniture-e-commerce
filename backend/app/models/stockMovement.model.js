const mongoose = require("mongoose");
const stockMovementSchema = new mongoose.Schema(
  {
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    reference_id: {
      type: String,
      required: true,
    },
    reference_type: {
      type: String,
      enum: ["purchase_order", "customer_order", "transfer", "adjustment"],
      default: "transfer",
    },
    quantity_change: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);
