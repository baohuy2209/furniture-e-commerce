const express = require("express");
const router = express.Router();
const productController = require("../app/controllers/product.controller");
router.get("/", productController.getAllProduct);
router.get("/news-product", productController.getNewProduct);
router.get("/best-seller-product", productController.getBestSellerProduct);
router.get("/:id", productController.getProductById);
module.exports = router;
