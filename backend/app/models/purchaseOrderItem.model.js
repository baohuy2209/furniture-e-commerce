const mongoose = require("mongoose");
const purchaseOrderItemSchema = new mongoose.Schema({
  po_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseOrder",
    required: true,
  },
  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true,
  },
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  product_name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  quantity_ordered: {
    type: Number,
    required: true,
  },
  unit_cost: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
});
module.exports = mongoose.model("PurchaseOrderItem", purchaseOrderItemSchema);
