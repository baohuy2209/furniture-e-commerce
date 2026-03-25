const express = require("express");
const warrantyController = require("../app/controllers/warranty.controller");
const router = express.Router();
const { upload } = require("../middlewares/multer");
const { authJwt } = require("../middlewares/index");
router.post(
  "/",
  upload.array("images", 5),
  [authJwt.protectedRoute],
  warrantyController.createWarrantyRequest,
);
router.get(
  "/user",
  [authJwt.protectedRoute],
  warrantyController.getUserWarranties,
);

// Admin only
router.get(
  "/",
  [authJwt.protectedRoute, authJwt.isAdmin],
  warrantyController.getAllWarranties,
);
router.get(
  "/:id",
  [authJwt.protectedRoute, authJwt.isAdmin],
  warrantyController.getWarrantyDetail,
);
router.patch(
  "/:id",
  [authJwt.protectedRoute, authJwt.isAdmin],
  warrantyController.updateWarrantyStatus,
);
router.delete(
  "/:id",
  [authJwt.protectedRoute, authJwt.isAdmin],
  warrantyController.deleteWarranty,
);

module.exports = router;
