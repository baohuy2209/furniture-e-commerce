const Voucher = require("../models/voucher.model");
const User = require("../models/user.model");

class PromotionController {
  // Lấy danh sách Voucher khả dụng
  async getVouchers(req, res) {
    try {
      const userId = req.userId;
      const vouchers = await Voucher.find({
        user: userId,
        status: "active",
        end_date: { $gte: new Date() },
      });
      return res.status(200).json({
        message: "Lấy danh sách Voucher thành công",
        data: vouchers,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // Lấy điểm thưởng của User
  async getUserPoints(req, res) {
    try {
      const user_id = req.userId;
      const user = await User.findById(user_id).select("points");
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy User" });
      }
      return res.status(200).json({
        message: "Lấy điểm thưởng thành công",
        data: user.points || 0,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }
}

module.exports = new PromotionController();
