const mongoose = require("mongoose");
const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
    },

    price: Number,
    weight: Number,

    num_inventory: Number,
    num_selled: Number,

    designed_by: String,
    rating: {
      average: Number,
      count: Number,
    },

    expected_delivery: String,

    // JSON động (height, width, diameter, seating_height...)
    measurement: mongoose.Schema.Types.Mixed,
    component_variants: mongoose.Schema.Types.Mixed,

    is_default: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
productVariantSchema.index({ price: 1 });
productVariantSchema.index({ product: 1 });
module.exports = mongoose.model("ProductVariant", productVariantSchema);
