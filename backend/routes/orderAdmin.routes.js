const express = require("express");
const router = express.Router();
const orderAdminController = require("../app/controllers/orderAdmin.controller");
const { protectedRoute, isAdmin } = require("../middlewares/auth.jwt");

// Admin routes for order management
// Temporarily omitting protectedRoute/isAdmin for debugging as we did for customers
router.get("/statistics", orderAdminController.getStatistics);
router.get("/", orderAdminController.getAllOrders);
router.get("/:id", orderAdminController.getOrderDetail);
router.patch("/:id/note", orderAdminController.updateOrderNote);
router.patch("/:id/status", orderAdminController.updateOrderStatus);

module.exports = router;
