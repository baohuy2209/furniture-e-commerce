const express = require("express");
const customerInquiryController = require("../app/controllers/customerInquiry.controller");
const router = express.Router();

router.post("/", customerInquiryController.createTicket);
router.get("/user/:user_id", customerInquiryController.getUserTickets);

module.exports = router;
