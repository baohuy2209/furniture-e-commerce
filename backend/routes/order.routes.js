const express = require("express");
const router = express.Router();
const orderController = require("../app/controllers/order.controller");
const { protectedRoute, isAdmin } = require("../middlewares/auth.jwt");

// User routes
router.post(
  "/checkout",
  protectedRoute,
  orderController.checkout.bind(orderController),
);
router.post("/checkout-without-login", orderController.checkoutWithoutLogin);
router.get(
  "/",
  protectedRoute,
  orderController.getUserOrders.bind(orderController),
);
router.get(
  "/:id",
  protectedRoute,
  orderController.getOrderDetail.bind(orderController),
);
router.patch(
  "/:id/cancel",
  protectedRoute,
  orderController.cancelOrder.bind(orderController),
);

// Admin routes (requires protectedRoute + isAdmin usually in real app, here we use what's configured)
// Following project pattern:
router.get(
  "/admin/all",
  protectedRoute,
  isAdmin,
  orderController.getAllOrdersAdmin.bind(orderController),
);
router.get(
  "/admin/:id",
  protectedRoute,
  isAdmin,
  orderController.getOrderDetailAdmin.bind(orderController),
);
router.put(
  "/admin/item-status/:orderItemId",
  protectedRoute,
  isAdmin,
  orderController.updateOrderItemStatus.bind(orderController),
);
router.put(
  "/admin/payment-status/:paymentId",
  protectedRoute,
  isAdmin,
  orderController.updatePaymentStatus.bind(orderController),
);

module.exports = router;
