const mongoose = require("mongoose");

const UpholsterySchema = new mongoose.Schema({
  name: { type: String, required: true },
  fabric_name: { type: String, required: true },
  color: { type: String, required: true },
  material: { type: String, required: true },
  image: { type: String, required: true },
});
module.exports = mongoose.model("Upholstery", UpholsterySchema);
