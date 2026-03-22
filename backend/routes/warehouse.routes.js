const express = require("express");
const router = express.Router();
const warehouseController = require("../app/controllers/warehouse.controller");
const { authJwt } = require("../middlewares");
router.get(
  "/",
  [authJwt.protectedRoute, authJwt.isModerator],
  warehouseController.getAllWarehouse,
);
router.get(
  "/:id",
  [authJwt.protectedRoute, authJwt.isModerator],
  warehouseController.getDetailWarehouse,
);
router.post(
  "/",
  [authJwt.protectedRoute, authJwt.isModerator],
  warehouseController.createNewWarehouse,
);
router.patch(
  "/:id",
  [authJwt.protectedRoute, authJwt.isModerator],
  warehouseController.updateInfoWarehouse,
);
router.delete(
  "/:id",
  [authJwt.protectedRoute, authJwt.isModerator],
  warehouseController.deleteWarehouse,
);
module.exports = router;
