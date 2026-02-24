const mongoose = require("mongoose");

const blogCategoriesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("BlogCategories", blogCategoriesSchema);
