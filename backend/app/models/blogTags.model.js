const mongoose = require("mongoose");
const blogTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true },
);
module.exports = mongoose.model("BlogTags", blogTagSchema);
