const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true, index: "text" },
    brand: { type: String },
    description: String,
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductTags",
      },
    ],
    discount_percent: {
      type: Number,
      default: 0,
    },

    is_assembly: {
      type: Boolean,
      default: false,
    },
    product_component: mongoose.Schema.Types.Mixed,
    warranty: Number,
    important_functions: [{ type: String }],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductCategory",
      },
    ],
    image_url: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);
productSchema.index({ product_name: "text", tags: "text" });
module.exports = mongoose.model("Product", productSchema);
