const express = require("express");
const router = express.Router();
const warehouseController = require("../app/controllers/warehouse.controller");

// Admin Warehouse Endpoints
router.get("/warehouses", warehouseController.getAllWarehouse.bind(warehouseController));
router.get("/stock-items", warehouseController.apiGetStockSummary.bind(warehouseController));
router.post("/adjust", warehouseController.apiAdjustStock.bind(warehouseController));
router.post("/purchase-order", warehouseController.apiCreatePurchaseOrder.bind(warehouseController));

module.exports = router;
