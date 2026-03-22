const mongoose = require("mongoose");

const PointHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      enum: ["adjust", "earn", "redeem"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PointHistory", PointHistorySchema);
