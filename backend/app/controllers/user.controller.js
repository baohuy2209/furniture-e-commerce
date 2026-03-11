const User = require("../models/user.model");

class UserController {
  // [GET] /api/user/:id
  async getUserInfo(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select("-password_hash");
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      return res.status(200).json({
        message: "Lấy thông tin người dùng thành công",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // [PATCH] /api/user/profile/:id
  async updateUserProfile(req, res) {
    try {
      const userId = req.params.id;
      // Do not allow updating password_hash or roles through this general profile update API
      const { updateData } = req.body;

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password_hash"); // exclude password_hash from response

      if (!updatedUser) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng", data: null });
      }

      return res.status(200).json({
        message: "Cập nhật thông tin người dùng thành công",
        data: updatedUser,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }

  // [POST] /api/user/change-password/:id
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;
      const bcrypt = require("bcrypt");

      const user = await User.findById(id).select("+password_hash");
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Mật khẩu cũ không chính xác" });
      }

      // Hash mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // [DELETE] /api/user/:id
  async deleteAccount(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      return res.status(200).json({ message: "Xóa tài khoản thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
