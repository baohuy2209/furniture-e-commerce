const mongoose = require("mongoose");
const blogCommentSchema = new mongoose.Schema(
  {
    // 🔗 Liên kết bài blog
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogPosts",
      required: true,
      index: true,
    },
    // 👤 Người comment
    author: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      avatar: String,
    },

    // 📝 Nội dung
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // ❤️ Thống kê tương tác
    stats: {
      likeCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("BlogComment", blogCommentSchema);
