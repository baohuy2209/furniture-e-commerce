const express = require("express");
const paymentMethodController = require("../app/controllers/paymentMethod.controller");
const router = express.Router();
const { authJwt } = require("../middlewares/index");
router.get(
  "/user",
  [authJwt.protectedRoute],
  paymentMethodController.getPaymentMethods,
);
router.post(
  "/",
  [authJwt.protectedRoute],
  paymentMethodController.addPaymentMethod,
);
router.delete(
  "/:id",
  [authJwt.protectedRoute],
  paymentMethodController.deletePaymentMethod,
);
router.patch(
  "/:id/default",
  [authJwt.protectedRoute],
  paymentMethodController.setDefault,
);

module.exports = router;
