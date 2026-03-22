const mongoose = require("mongoose");
const warrantyRequestSchemas = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    request_date: {
      type: Date,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    issue_description: {
      type: String,
      required: true,
    },
    warranty_status: {
      type: String,
      enum: ["unresolved", "resolved", "rejected"],
      default: "unresolved",
    },
    approved_by: {
      type: String,
    },
    approved_date: {
      type: Date,
    },
    resolution_note: {
      type: String,
    },
    completed_date: {
      type: Date,
    },
    product_variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

module.exports = mongoose.model("WarrantyRequest", warrantyRequestSchemas);
