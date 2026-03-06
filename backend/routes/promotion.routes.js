const express = require("express");
const promotionController = require("../app/controllers/promotion.controller");
const router = express.Router();

router.get("/vouchers", promotionController.getVouchers);
router.get("/points/:user_id", promotionController.getUserPoints);

module.exports = router;
