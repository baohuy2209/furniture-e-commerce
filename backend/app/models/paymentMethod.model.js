const mongoose = require("mongoose");
const paymentMethodSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["bank", "wallet", "cash"], required: true },
        bankName: { type: String, required: true },
        name: { type: String, required: true }, // e.g., "Ngân hàng", "Ví điện tử"
        cardNumber: { type: String },
        owner: { type: String },
        isDefault: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);
module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
