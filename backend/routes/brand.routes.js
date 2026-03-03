const express = require("express");
const router = express.Router();
const brandController = require("../app/controllers/brand.controller");
router.get("/", brandController.getAllBrands);
router.get("/:id", brandController.getBrandDetails);
router.post("/", brandController.createNewBrand);
router.patch("/:id", brandController.updateInfoBrand);
router.delete("/:id", brandController.deleteBrand);
module.exports = router;
