const Review = require("../models/review.model");

class ReviewController {
  // [POST] /api/reviews
  async submitReview(req, res) {
    try {
      const { product_id, user_id, rating, comments, images } = req.body;
      const newReview = new Review({
        product_id,
        user_id,
        rating,
        comments,
        images,
      });
      await newReview.save();
      return res.status(200).json({
        message: "Gửi đánh giá thành công",
        data: newReview,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }

  // [GET] /api/reviews/product/:id
  async getReviewsByProduct(req, res) {
    try {
      const productId = req.params.id;
      const reviews = await Review.find({ product_id: productId }).populate(
        "user_id",
        "name avatar",
      );
      return res.status(200).json({
        message: "Lấy danh sách đánh giá thành công",
        data: reviews,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }

  // [GET] /api/reviews/user/:user_id
  async getReviewsByUser(req, res) {
    try {
      const userId = req.params.user_id;
      const reviews = await Review.find({ user_id: userId }).populate(
        "product_id",
      );
      return res.status(200).json({
        message: "Lấy danh sách đánh giá của user thành công",
        data: reviews,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }
}

module.exports = new ReviewController();
