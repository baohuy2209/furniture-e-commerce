const orderService = require("../../services/order.service");
const Review = require("../models/review.model");
const ProductVariant = require("../models/productVariant.model");
const { uploadImage } = require("../../utils/utils");
class ReviewController {
  // [POST] /api/reviews
  async submitReview(req, res) {
    try {
      const user_id = req.userId;
      const { orderItemId, rating, comments, images } = req.body;
      const orderItemUpdatedStatus =
        await orderService.updateOrderItemsReview(orderItemId);
      if (!orderItemUpdatedStatus) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy dữ liệu", data: null });
      }
      const productVariantId = orderItemUpdatedStatus.product_variant_id;
      const productVariant = await ProductVariant.findById(productVariantId);
      if (!productVariant) {
        return res.status(404).json({
          message: "Không tìm thấy dữ liệu biến thể sản phẩm",
          data: null,
        });
      }
      const newReview = new Review({
        product_id: productVariant.product,
        user_id,
        rating,
        comments,
        images,
        order_item_id: orderItemId,
      });
      await newReview.save();
      let finalImages = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadImage(file.path, "reviews"),
        );
        const uploadResults = await Promise.all(uploadPromises);
        finalImages = uploadResults.map((result) => result.url);
      } else if (req.body.images) {
        const images = req.body.images;
        finalImages = images.map((img) => img.url || img);
      }
      newReview.images = finalImages;
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

  // [GET] /api/reviews/user
  async getReviewsByUser(req, res) {
    try {
      const userId = req.userId;
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
  // [GET] /api/reviews/admin/news-review
  async getNewsReviewByAdmin(req, res) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const reviews = await Review.find({
        createdAt: { $gte: thirtyDaysAgo },
      })
        .populate("product_id", "product_name")
        .populate("user_id", "fullname email")
        .sort({ createdAt: -1 });
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: reviews });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }
}

module.exports = new ReviewController();
