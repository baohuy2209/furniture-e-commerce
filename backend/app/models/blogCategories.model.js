const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const blogCategoriesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, slug: "name", unique: true },
    description: { type: String },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("BlogCategories", blogCategoriesSchema);
