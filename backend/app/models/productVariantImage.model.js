const mongoose = require("mongoose");
const productVariantImageSchema = new mongoose.Schema(
  {
    product_variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    url: { type: String, required: true },

    is_main: {
      type: Boolean,
      default: false,
    },

    position: Number,
  },
  { timestamps: true },
);
productVariantImageSchema.index({ product_variant: 1 });
module.exports = mongoose.model(
  "ProductVariantImage",
  productVariantImageSchema,
);
