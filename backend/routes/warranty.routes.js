const express = require("express");
const warrantyController = require("../app/controllers/warranty.controller");
const router = express.Router();
const { upload } = require("../middlewares/multer");

// User & Admin
router.post("/", upload.array("images", 5), warrantyController.createWarrantyRequest);
router.get("/user/:user_id", warrantyController.getUserWarranties);

// Admin only
router.get("/", warrantyController.getAllWarranties);
router.get("/:id", warrantyController.getWarrantyDetail);
router.patch("/:id", warrantyController.updateWarrantyStatus);

module.exports = router;