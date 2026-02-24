const mongoose = require("mongoose");
const productTagsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true },
);
module.exports = mongoose.model("ProductTags", productTagsSchema);
