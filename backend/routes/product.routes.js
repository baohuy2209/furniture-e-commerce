const express = require("express");
const router = express.Router();
const productController = require("../app/controllers/product.controller");
router.get("/", productController.getAllProduct);
router.get("/living-room", productController.getAllLivingRoomProduct);
router.get("/bathroom", productController.getAllBathroomProduct);
router.get("/bedroom", productController.getAllBedroomProduct);
router.get("/dining-room", productController.getAllDiningRoomProduct);
router.get("/outdoor", productController.getAllOutdoorProduct);
router.get("/accessories", productController.getAllAccessoriesProduct);
router.get("/news-product", productController.getNewProduct);
router.get("/best-seller-product", productController.getBestSellerProduct);
router.get(
  "/best-seller-product/living-room",
  productController.getBestSellerProductLivingRoom,
);
router.get(
  "/best-seller-product/bedroom",
  productController.getBestSellerProductBedroom,
);
router.get(
  "/best-seller-product/dining-room",
  productController.getBestSellerProductDiningRoom,
);
router.get(
  "/best-seller-product/outdoor",
  productController.getBestSellerProductOutdoor,
);
router.get(
  "/best-seller-product/bathroom",
  productController.getBestSellerProductBathroom,
);
router.get(
  "/best-seller-product/accessories",
  productController.getBestSellerProductAccessories,
);
router.post("/related-product", productController.getRelatedProduct);
router.get("/:id", productController.getProductById);
module.exports = router;
