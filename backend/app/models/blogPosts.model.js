const mongoose = require("mongoose");
const blogPostsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    thumbnail_url: { url: { type: String, required: true }, alt: String },
    description: { type: String, maxlength: 250 },
    content: [
      {
        _id: false,
        type: {
          type: String,
          enum: ["paragraph", "image", "heading", "list", "code", "embed"],
          required: true,
        },
        data: mongoose.Schema.Types.Mixed,
        order: Number,
      },
    ],
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BlogTags",
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogAuthor",
      required: true,
    },
    activity: {
      total_likes: {
        type: Number,
        default: 0,
      },
      total_comments: {
        type: Number,
        default: 0,
      },
      total_reads: {
        type: Number,
        default: 0,
      },
    },
    comments: {
      type: String,
    },
    draft: {
      type: Boolean,
      default: false,
    },
    categories: { type: mongoose.Schema.Types.ObjectId, ref: "BlogCategories" },
    time_reads: {
      type: Number,
    },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: { type: [String] },
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("BlogPosts", blogPostsSchema);
