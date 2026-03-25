const express = require("express");
const reviewController = require("../app/controllers/review.controller");
const router = express.Router();
const { authJwt } = require("../middlewares/index");
const { upload } = require("../middlewares/multer");

router.post(
  "/",
  upload.array("images", 10),
  [authJwt.protectedRoute],
  reviewController.submitReview,
);
router.get("/product/:id", reviewController.getReviewsByProduct);
router.get(
  "/user",
  [authJwt.protectedRoute],
  reviewController.getReviewsByUser,
);
router.get("/admin/news-review", reviewController.getNewsReviewByAdmin);

module.exports = router;
