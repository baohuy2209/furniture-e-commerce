const express = require("express");
const router = express.Router();
const adminProductController = require("../app/controllers/admin.product.controller");
const { protectedRoute, isAdmin } = require("../middlewares/auth.jwt");

// Temporarily disabling auth for local development
// router.use(protectedRoute, isAdmin);

// List, Search, Filter, Pagination
router.get("/", adminProductController.listProducts);

// Get Detail (inc variants and images)
router.get("/:id", adminProductController.getProductDetail);

// Create new product (with variants, images)
router.post("/", adminProductController.createProduct);

// Update product
router.put("/:id", adminProductController.updateProduct);

// Soft delete / Hide product (optional)
router.delete("/:id", adminProductController.deleteProduct);

module.exports = router;
