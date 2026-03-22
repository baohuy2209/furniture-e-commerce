const mongoose = require("mongoose");
const warrantyImageSchema = new mongoose.Schema(
  {
    warranty_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WarrantyRequest",
      required: true,
    },
    image_url: [
      {
        url: { type: String },
        caption: { type: String },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);
module.exports = mongoose.model("WarrantyImage", warrantyImageSchema);
