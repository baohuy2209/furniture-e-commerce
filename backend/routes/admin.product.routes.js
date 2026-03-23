const express = require("express");
const router = express.Router();
const productController = require("../app/controllers/product.controller");
const { protectedRoute, isAdmin } = require("../middlewares/auth.jwt");

// Temporarily disabling auth for local development
// router.use(protectedRoute, isAdmin);

// List, Search, Filter, Pagination
router.get("/", (req, res) => productController.apiGetAdminProducts(req, res));

// Get Detail (inc variants and images)
router.get("/:id", (req, res) => productController.apiGetProductDetail(req, res));

// Create new product (with variants, images)
router.post("/", (req, res) => productController.apiCreateProduct(req, res));

// Update product
router.put("/:id", (req, res) => productController.apiUpdateProduct(req, res));

// Soft delete / Hide product
router.delete("/:id", (req, res) => productController.apiDeleteProduct(req, res));

module.exports = router;
