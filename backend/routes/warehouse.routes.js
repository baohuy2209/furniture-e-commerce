const express = require("express");
const router = express.Router();
const warehouseController = require("../app/controllers/warehouse.controller");
// const { authJwt } = require("../middlewares");

// Temporarily disabling auth for local development
// router.use(authJwt.protectedRoute, authJwt.isModerator);

router.get("/", warehouseController.getAllWarehouse);
router.get("/:id", warehouseController.getDetailWarehouse);
router.post("/", warehouseController.createNewWarehouse);
router.patch("/:id", warehouseController.updateInfoWarehouse);
router.delete("/:id", warehouseController.deleteWarehouse);

module.exports = router;
