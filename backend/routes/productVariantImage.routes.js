const router = require("express").Router();
const productVariantImageController = require("../app/controllers/productVariantImage.controller");
router.get(
  "/product-variants/:id",
  productVariantImageController.getAllImageByProductVariantId,
);
router.get(
  "/product-variants/default/:id",
  productVariantImageController.getDefaultImageByProductVariantId
)
module.exports = router;
