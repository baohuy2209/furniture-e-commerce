const express = require("express");
const router = express.Router();
const poController = require("../app/controllers/purchaseOrder.controller");
// const { authJwt } = require("../middlewares");

// Temporarily disabling auth for local development
// router.use(authJwt.protectedRoute, authJwt.isModerator);

router.get("/", poController.getAllPurchaseOrders);
router.get("/:id", poController.getPurchaseOrderDetail);
router.post("/", poController.createPurchaseOrder);
router.patch("/:id/status", poController.updatePOStatus);

module.exports = router;
