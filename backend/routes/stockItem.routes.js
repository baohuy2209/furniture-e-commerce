const express = require("express");
const router = express.Router();
const stockItemController = require("../app/controllers/stockItem.controller");
// const { authJwt } = require("../middlewares");

// Temporarily disabling auth for local development
// router.use(authJwt.protectedRoute, authJwt.isModerator);

router.get("/", stockItemController.getAllStockItems);
router.get("/product-variant-id/:id", stockItemController.getStockItemByProductVariant);
router.get("/:id", stockItemController.getStockItemById);
router.post("/", stockItemController.createStockItem);

module.exports = router;
