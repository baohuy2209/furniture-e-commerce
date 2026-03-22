const express = require("express");
const router = express.Router();
const adminWarehouseController = require("../app/controllers/admin.warehouse.controller");

// Admin Warehouse Endpoints
router.get("/warehouses", adminWarehouseController.listWarehouses);
router.get("/stock-items", adminWarehouseController.listStockItems);
router.post("/adjust", adminWarehouseController.adjustStock);
router.post("/purchase-order", adminWarehouseController.createPurchaseOrder);

module.exports = router;
