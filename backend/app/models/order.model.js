const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    order_number: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "packed",
        "shipping",
        "delivered",
        "cancelled",
        "return_requested",
        "returned",
        "exchange_requested",
        "exchanged",
        "uncompleted",
        "completed",
      ],
      default: "pending",
      required: true,
    },
    admin_note: {
      type: String,
      default: "",
    },
    total_items: {
      type: Number,
      required: true,
    },
    // Tổng số tiền khi chưa giảm giá
    before_total: {
      type: Number,
      required: true,
    },
    // Tổng số tiền giảm giá trên toàn bộ đơn hàng
    discount_total: {
      type: Number,
      default: 0,
    },
    // Tổng chi phí vận chuyển (VNĐ)
    total_shipping_fee: {
      type: Number,
      default: 0,
    },
    // Tổng số tiền cần thanh toán
    total_amount: {
      type: Number,
      required: true,
    },
    // Trạng thái thanh toán
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    note: {
      type: String,
    },
    completed_at: {
      type: Date,
    },
    cancel_reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Order", orderSchema);
