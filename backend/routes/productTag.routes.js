const express = require("express");
const router = express.Router();
const productTagsController = require("../app/controllers/productTags.controller");
router.get("/", productTagsController.getAllProductTags);
router.post("/", productTagsController.createNewProductTags);
router.patch("/:id", productTagsController.updateProductTags);
router.delete("/:id", productTagsController.deleteProductTags);
module.exports = router;
