const express = require("express");
const router = express.Router();
const stockItemController = require("../app/controllers/stockItem.controller");
const { authJwt } = require("../middlewares");
router.get(
  "/",
  [authJwt.protectedRoute, authJwt.isModerator],
  stockItemController.getAllStockItems,
);
router.get(
  "/:id",
  [authJwt.protectedRoute, authJwt.isModerator],
  stockItemController.getStockItemById,
);
router.get(
  "/product-variant-id/:id",
  stockItemController.getStockItemByProductVariant,
);
router.post(
  "/",
  [authJwt.protectedRoute, authJwt.isModerator],
  stockItemController.createStockItem,
);

module.exports = router;
