const express = require("express");
const orderController = require("../app/controllers/order.controller");
const router = express.Router();

router.get("/user/:user_id", orderController.getOrdersByUserId);
router.get("/:id", orderController.getOrderDetail);

module.exports = router;
