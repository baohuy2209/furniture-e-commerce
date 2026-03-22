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
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("WarrantyImage", warrantyImageSchema);
