const mongoose = require("mongoose");
const BlogAuthorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: { type: String, required: true },
    slug: {
      type: String,
      slug: "name",
      unique: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    avatar_url: String,

    bio: {
      type: String,
      maxlength: 1000,
    },

    social_links: {
      facebook: String,
      github: String,
      twitter: String,
      linkedin: String,
      website: String,
    },

    role: {
      type: String,
      enum: ["admin", "editor", "writer"],
      default: "writer",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);
BlogAuthorSchema.index({ name: "text", bio: "text" });
module.exports = mongoose.model("BlogAuthor", BlogAuthorSchema);
