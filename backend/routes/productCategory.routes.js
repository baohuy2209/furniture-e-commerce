const express = require("express");
const router = express.Router();
const productCategoryController = require("../app/controllers/productCategory.controller");
router.get("/", productCategoryController.getAllProductCategories);
router.get("/:id", productCategoryController.getProductCategoryDetail);
router.post("/", productCategoryController.createNewProductCategory);
router.patch("/:id", productCategoryController.updateProductCategory);
router.delete("/:id", productCategoryController.deleteProductCategory);
module.exports = router;
