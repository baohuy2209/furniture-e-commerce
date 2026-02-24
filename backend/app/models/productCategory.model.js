const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);
const productCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, slug: "name", unique: true },
    type: {
      type: String,
      enum: ["product_type", "room_type"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ProductCategory", productCategorySchema);
