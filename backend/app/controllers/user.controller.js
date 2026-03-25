const userService = require("../../services/user.service");
const { uploadImage } = require("../../utils/utils");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
class UserController {
  // [GET] /api/user/
  async getUserInfo(req, res) {
    try {
      const id = req.userId;
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

  // [PATCH] /api/user/profile
  async updateUserProfile(req, res) {
    try {
      const userId = req.userId;
      // Do not allow updating password_hash or roles through this general profile update API
      const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
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
  // [PATCH] /api/user/profile/images
  async updateUserAvatar(req, res) {
    try {
      const userId = req.userId;
      const file = req.file;
      const imageUrl = (await uploadImage(file.path, "user")).url;
      const userInfo = await User.findByIdAndUpdate(userId, {
        avatar: imageUrl,
      });
      if (!userInfo) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy thông tin người dùng" });
      }
      return res
        .status(200)
        .json({ message: "Đã cập nhật thành công ảnh đại diện" });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }
  // [POST] /api/user/change-password
  async changePassword(req, res) {
    try {
      const userId = req.userId;
      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(userId).select("+password_hash");
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

  // [DELETE] /api/user
  async deleteAccount(req, res) {
    try {
      const id = req.userId;
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
  // [POST] /api/user/create-user
  async createUserGuest(req, res) {
    try {
      const { name, email, phone } = req.body;
      const { data, message } = await userService.createUser(
        email,
        name,
        phone,
      );
      if (!data) {
        return res.status(401).json({ message, data: null });
      }
      return res.status(200).json({ message, data });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }
  // [POST] /api/user/admin/
  async getAllInfoUser(req, res) {
    try {
      const listUserInfo = await User.find();
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: listUserInfo });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }
  // [POST] /api/user/admin/:id
  async changeStatusAccount(req, res) {
    try {
      const userId = req.params.id;
      const { status } = req.body;
      const findedUser = await User.findByIdAndUpdate(userId, {
        status: status,
      });
      if (!findedUser) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy tài khoản cần khóa", data: null });
      }
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: findedUser });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
