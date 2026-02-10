const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const productSchema = new mongoose.Schema({
  product_name: { type: String, required: true, index: "text" },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
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
  important_functions: [String],
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
    },
  ],
});
productSchema.index({ product_name: 'text', tags: 'text' });
module.exports = mongoose.model("Product", productSchema);
