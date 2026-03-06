const mongoose = require("mongoose");
const customerInquirySchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "closed"],
            default: "open",
        },
        resolving_staff_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        staff_response: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("CustomerInquiry", customerInquirySchema);
