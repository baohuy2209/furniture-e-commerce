const express = require("express");
const router = express.Router();
const cartController = require("../app/controllers/cart.controller");
const { protectedRoute } = require("../middlewares/auth.jwt");

router.get("/", protectedRoute, cartController.getCart.bind(cartController));
router.post("/add", protectedRoute, cartController.addToCart.bind(cartController));
router.put("/update", protectedRoute, cartController.updateQuantity.bind(cartController));
router.delete("/remove/:itemId", protectedRoute, cartController.removeItem.bind(cartController));
router.delete("/clear", protectedRoute, cartController.clearCart.bind(cartController));

module.exports = router;
