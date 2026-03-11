const mongoose = require("mongoose");

const UserAddress = mongoose.model(
  "UserAddress",
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
      },
      province: {
        type: String,
        required: true,
      },
      ward: {
        type: String,
        required: true,
      },
      address_detail: {
        type: String,
        required: true,
      },
      is_default: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true },
  ),
);

module.exports = UserAddress;
