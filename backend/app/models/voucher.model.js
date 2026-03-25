const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const voucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    voucher_name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
    type: {
      type: String,
      enum: ["percent", "fixed", "freeship"],
      default: "percent",
    },
    min_order_value: { type: Number, default: 0 },
    usage_limit: { type: Number, default: 0 }, // 0 means unlimited
    used_count: { type: Number, default: 0 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "paused", "expired", "pending"],
      default: "active",
    },
    description: { type: String },
    appliedTo: { type: String, enum: ["all", "specific"], default: "all" },
    applied_products: [{ type: String }], // Array of Product SKU/IDs
  },
  {
    timestamps: true,
  },
);

voucherSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Voucher", voucherSchema);
