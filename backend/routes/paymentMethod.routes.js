const express = require("express");
const paymentMethodController = require("../app/controllers/paymentMethod.controller");
const router = express.Router();

router.get("/user/:user_id", paymentMethodController.getPaymentMethods);
router.post("/", paymentMethodController.addPaymentMethod);
router.delete("/:id", paymentMethodController.deletePaymentMethod);
router.patch("/:id/default", paymentMethodController.setDefault);

module.exports = router;
