const mongoose = require("mongoose");
const customerInquirySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    resolving_staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    staff_response: {
      type: String,
    },
    internal_notes: {
      type: String,
    },
    due_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CustomerInquiry", customerInquirySchema);
