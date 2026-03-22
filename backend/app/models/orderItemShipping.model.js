const mongoose = require("mongoose");
const orderItemShippingSchema = new mongoose.Schema(
  {
    order_item_id: { type: mongoose.Schema.Types.ObjectId, ref: "OrderItem" },
    shipping_discount_percent: { type: Number, default: 0 },
    address_id: { type: mongoose.Schema.Types.ObjectId, ref: "UserAddress" },
    shipping_method: {
      type: String,
      enum: [
        /**
         * Giao tiêu chuẩn.
         * Hàng được giao đến trước cửa nhà / sảnh chung cư.
         * Không bao gồm lắp đặt.
         */
        "STANDARD_DELIVERY",
        /**
         * Giao hàng cồng kềnh.
         * Áp dụng cho sofa, tủ, giường lớn.
         * Có thể tính phí theo thể tích (CBM).
         */
        "BULKY_DELIVERY",
        /**
         * Dịch vụ cao cấp (White Glove).
         * Bao gồm: giao tận phòng + lắp đặt + thu dọn bao bì.
         */
        "WHITE_GLOVE_DELIVERY",
        /**
         * Giao theo lịch hẹn trước.
         * Khách hàng chọn ngày/khung giờ giao.
         */
        "SCHEDULED_DELIVERY",
        /**
         * Khách tự đến cửa hàng nhận hàng.
         * Phù hợp mô hình omnichannel.
         */
        "STORE_PICKUP",
        /**
         * Nhận hàng trực tiếp tại kho trung tâm.
         * Thường áp dụng cho khách B2B hoặc đơn lớn.
         */
        "WAREHOUSE_PICKUP",
        /**
         * Giao hàng quốc tế (cross-border).
         * Thời gian giao lâu hơn, có thể phát sinh thuế nhập khẩu.
         */
        "CROSS_BORDER_DELIVERY",

        /**
         * Dropship.
         * Hàng được gửi trực tiếp từ nhà sản xuất.
         * Sàn không lưu kho.
         */
        "DROPSHIP_DELIVERY",
        /**
         * Giao nhanh cho hàng cồng kềnh.
         * Áp dụng tại nội thành, có phụ phí cao hơn.
         */
        "EXPRESS_LARGE_ITEM",
        /**
         * Chỉ bao gồm dịch vụ lắp đặt.
         * Áp dụng khi sản phẩm đã được giao trước đó.
         */
        "INSTALLATION_ONLY",
      ],
      default: "STANDARD_DELIVERY",
      required: true,
    },
    shipping_fee: { type: Number, required: true, default: 0 },
    estimate_delivery: {
      type: String,
      required: true,
      default: "3-5 ngày",
    },
    note: {
      type: String,
    },
    /**
const ShippingProvider = [
  "GHN",
  "GHTK",
  "VIETTEL_POST",
  "VNPOST",
  "JT_EXPRESS",
  "BEST_EXPRESS",
  "NINJA_VAN",
  "AHAMOVE",
  "LALAMOVE",
  "PROSHIP",
  "DHL",
  "FEDEX",
  "UPS",
  "EMS",
  "SPX",
  "LEX",
  "TIKINOW"
];
   */
    shipping_provider: {
      type: String,
      default: "J&T",
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("OrderItemShipping", orderItemShippingSchema);
