const express = require("express");
const customerInquiryController = require("../app/controllers/customerInquiry.controller");
const { authJwt } = require("../middlewares");
const router = express.Router();

// Client routes
router.post("/", [authJwt.protectedRoute], customerInquiryController.createTicket);

router.get("/user", [authJwt.protectedRoute], customerInquiryController.getUserTickets);

// Admin routes
router.get("/all", customerInquiryController.getAllTickets);

router.get("/:id", customerInquiryController.getTicketById);

router.patch("/respond/:id", customerInquiryController.respondToTicket);

router.delete("/:id", customerInquiryController.deleteTicket);

module.exports = router;
