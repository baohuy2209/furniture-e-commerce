const express = require("express");
const router = express.Router();
const stockItemController = require("../app/controllers/stockItem.controller");

router.get("/", stockItemController.getAllStockItems);
router.get("/:id", stockItemController.getStockItemById);
router.post("/", stockItemController.createStockItem);

module.exports = router;
