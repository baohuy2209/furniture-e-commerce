const mongoose = require("mongoose");
const userAddressSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        specific_address: { type: String, required: true },
        postal_code: { type: String },
        is_default: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("UserAddress", userAddressSchema);
