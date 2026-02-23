const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema(
  {
    event_name: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    max_participants: { type: Number },
    event_status: {
      type: String,
      enum: ["prepare", "happening", "ended", "cancelled"],
      default: "prepare",
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Event", eventSchema);
