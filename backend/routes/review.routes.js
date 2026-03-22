const express = require("express");
const reviewController = require("../app/controllers/review.controller");
const router = express.Router();
const { authJwt } = require("../middlewares/index");

router.post("/", [authJwt.protectedRoute], reviewController.submitReview);
router.get("/product/:id", reviewController.getReviewsByProduct);
router.get(
  "/user",
  [authJwt.protectedRoute],
  reviewController.getReviewsByUser,
);
router.get("/admin/news-review", reviewController.getNewsReviewByAdmin);

module.exports = router;
