const mongoose = require("mongoose");
const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address_warehouse: {
    type: String,
    required: true,
  },
  warehouse_area: {
    type: String,
    required: true,
  },
  warehouse_status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
});
module.exports = mongoose.model("Warehouse", warehouseSchema);
