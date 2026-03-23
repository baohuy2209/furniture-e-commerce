const express = require("express");
const router = express.Router();
const voucherController = require("../app/controllers/voucher.controller");

// Admin Voucher Routes
router.get("/", voucherController.apiGetVouchers);
router.get("/:id", voucherController.apiGetVoucherDetail);
router.post("/", voucherController.apiCreateVoucher);
router.put("/:id", voucherController.apiUpdateVoucher);
router.patch("/:id/toggle", voucherController.apiToggleVoucher);
router.delete("/:id", voucherController.apiDeleteVoucher);

module.exports = router;
