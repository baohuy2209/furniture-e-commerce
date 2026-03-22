const mongoose = require("mongoose");
const productCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    type: {
      type: String,
      enum: ["product_type", "room_type"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ProductCategory", productCategorySchema);
