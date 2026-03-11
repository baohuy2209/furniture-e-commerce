const mongoose = require("mongoose");
const voucherSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    value: { type: Number, required: true }, // Giảm giá cố định hoặc phần trăm
    type: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    expiryDate: { type: Date, required: true },
    conditions: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "expired", "used"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Voucher", voucherSchema);
