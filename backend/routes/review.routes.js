const express = require("express");
const reviewController = require("../app/controllers/review.controller");
const router = express.Router();

router.post("/", reviewController.submitReview);
router.get("/product/:id", reviewController.getReviewsByProduct);
router.get("/user/:user_id", reviewController.getReviewsByUser);

module.exports = router;
