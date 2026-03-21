const mongoose = require("mongoose");
const orderItemSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    product_variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    product_name: { type: String, required: true },
    unit_price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    discount_percent: {
      type: Number,
      default: 0,
    },
    // Tổng số tiền phải chi trả cho sản phẩm đó
    item_subtotal: { type: Number, required: true },
    /**
-'pending': đang soạn hàng ra khỏi kho. 
-'packed': đã đóng gói.
-'shipped': doanh nghiệp đã xuất kho vật chuyển cho khách hàng.
-'delivered': đã giao hàng.
-‘returned’: yêu cầu trả hàng  
-'cancelled': đã trả hàng 
   */
    status: {
      type: String,
      enum: [
        "pending",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("OrderItem", orderItemSchema);
