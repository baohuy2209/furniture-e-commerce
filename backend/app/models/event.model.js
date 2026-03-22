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
const TimelineEvent = new Schema(
  {
    start_time: String,
    end_time: String,
    title: String,
    description: String,
  },
  { _id: false },
);
const eventSchema = new Schema(
  {
    title: String,
    slug: String,
    description: String,
    images: [
      {
        url_image: { type: String },
        is_main: { type: Boolean, default: false },
      },
    ],
    category: {
      type: String,
    },
    // Các điểm nổi bật
    hightlight_des: [
      {
        type: String,
      },
    ],
    date_range: {
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
    timeline_event: [
      {
        type: TimelineEvent,
      },
    ],
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
