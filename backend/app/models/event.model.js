const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RegistrationSchema = new Schema(
  {
    requireRegister: {
      type: Boolean,
      default: true, // có cần đăng ký trước không
    },

    isFree: {
      type: Boolean,
      default: true, // miễn phí hay trả phí
    },

    maxSlot: {
      type: Number, // tổng số chỗ
      required: true,
    },

    registeredCount: {
      type: Number,
      default: 0, // số người đã đăng ký
    },
  },
  { _id: false },
);
const eventSchema = new Schema(
  {
    title: String,
    slug: String,
    description: String,

    dateRange: {
      startDate: Date,
      endDate: Date,
    },

    location: {
      name: String,
      address: String,
      city: String,
    },

    registration: RegistrationSchema,

    status: {
      type: String,
      enum: ["UPCOMING", "ONGOING", "ENDED"],
      default: "UPCOMING",
    },
    search_text: {
      type: String,
      index: true, // rất quan trọng
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Event", eventSchema);
