const express = require("express");
const router = express.Router();
const productController = require("../app/controllers/product.controller");
const { protectedRoute, isAdmin } = require("../middlewares/auth.jwt");

// Temporarily disabling auth for local development
// router.use(protectedRoute, isAdmin);

// List, Search, Filter, Pagination
router.get("/", productController.apiGetAdminProducts.bind(productController));

// Get Detail (inc variants and images)
router.get("/:id", productController.apiGetProductDetail.bind(productController));

// Create new product (with variants, images)
router.post("/", productController.apiCreateProduct.bind(productController));

// Update product
router.put("/:id", productController.apiUpdateProduct.bind(productController));

// Soft delete / Hide product
router.delete("/:id", productController.apiDeleteProduct.bind(productController));

module.exports = router;
