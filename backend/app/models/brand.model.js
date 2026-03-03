const mongoose = require("mongoose");
const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    address: String,
    phone: String,
    contact_email: String,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Brand", brandSchema);
