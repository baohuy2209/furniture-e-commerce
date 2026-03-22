const router = require("express").Router();
const productVariantController = require("../app/controllers/productVariant.controller");
router.get("/:id", productVariantController.getDetailProductVariant);
router.get("/:id/default", productVariantController.getDefaultVariantProduct);
router.get("/products/:id", productVariantController.getAllVariantByProductId);
module.exports = router;
