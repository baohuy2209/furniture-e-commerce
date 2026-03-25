const express = require("express");
const promotionController = require("../app/controllers/promotion.controller");
const router = express.Router();
const { authJwt } = require("../middlewares/index");
router.get(
  "/vouchers",
  [authJwt.protectedRoute],
  promotionController.getVouchers,
);
router.get(
  "/points",
  [authJwt.protectedRoute],
  promotionController.getUserPoints,
);

module.exports = router;
