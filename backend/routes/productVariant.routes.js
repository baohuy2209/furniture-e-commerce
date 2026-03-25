const router = require("express").Router();
const productVariantController = require("../app/controllers/productVariant.controller");
router.get("/", productVariantController.getAllVariants);
router.get(
  "/products/:productId/select",
  productVariantController.getVariantByMeasurementFields,
);
router.get("/products/:id", productVariantController.getAllVariantByProductId);
router.get("/:id/default", productVariantController.getDefaultVariantProduct);
router.get("/:id", productVariantController.getDetailProductVariant);
module.exports = router;
