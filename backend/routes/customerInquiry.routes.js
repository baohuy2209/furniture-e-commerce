const express = require("express");
const customerInquiryController = require("../app/controllers/customerInquiry.controller");
const { authJwt } = require("../middlewares");
const router = express.Router();

router.post(
  "/",
  [authJwt.protectedRoute],
  customerInquiryController.createTicket,
);
router.get(
  "/user",
  [authJwt.protectedRoute],
  customerInquiryController.getUserTickets,
);

module.exports = router;
