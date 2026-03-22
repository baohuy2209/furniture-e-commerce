const UserAddress = require("../models/userAddress.model");

class AddressController {
  // [PATCH] /api/addresses/default_address/:id
  async setDefaultAddress(req, res) {
    try {
      const addressId = req.params.id;
      const addresses = await UserAddress.findByIdAndUpdate(addressId, {
        is_default: true,
      });
      if (!addresses) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy địa chỉ nào", data: null });
      }
      const userId = req.userId;
      const otherDefaultAddress = await UserAddress.findOne({
        user: userId,
        is_default: true,
      });
      if (!otherDefaultAddress) {
        return res
          .status(404)
          .json({
            message: "không tìm thấy địa chỉ mặc định lúc trước",
            data: null,
          });
      }
      otherDefaultAddress.is_default = false;
      await otherDefaultAddress.save();
      return res
        .status(200)
        .json({ data: addresses, message: "Cập nhật dữ liệu thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message, data: null });
    }
  }
  // Lấy danh sách địa chỉ của user
  async getAddresses(req, res) {
    try {
      const user_id = req.userId;
      const addresses = await UserAddress.find({ user: user_id });
      return res
        .status(200)
        .json({ data: addresses, message: "Lấy dữ liệu thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message, data: null });
    }
  }

  // Thêm địa chỉ mới
  async addAddress(req, res) {
    try {
      const { _id, ...data } = req.body;
      console.log(_id);
      const newAddress = await UserAddress.create(data);
      return res
        .status(201)
        .json({ message: "Thêm địa chỉ thành công", data: newAddress });
    } catch (error) {
      return res.status(500).json({ message: error.message, data: null });
    }
  }

  // Xóa địa chỉ
  async deleteAddress(req, res) {
    try {
      const { id } = req.params;
      await UserAddress.findByIdAndDelete(id);
      return res.status(200).json({ message: "Xóa địa chỉ thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new AddressController();
