const PaymentMethod = require("../models/paymentMethod.model");

class PaymentMethodController {
  // Lấy danh sách phương thức thanh toán của user
  async getPaymentMethods(req, res) {
    try {
      const { user_id } = req.params;
      const methods = await PaymentMethod.find({ user_id });
      return res.status(200).json({
        message: "Lấy danh sách phương thức thanh toán thành công",
        data: methods,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // Thêm mới phương thức thanh toán
  async addPaymentMethod(req, res) {
    try {
      const { user_id, type, bankName, name, cardNumber, owner, isDefault } =
        req.body;

      // Nếu đặt làm mặc định thì bỏ mặc định của các cái cũ
      if (isDefault) {
        await PaymentMethod.updateMany({ user_id }, { isDefault: false });
      }

      const newMethod = await PaymentMethod.create({
        user_id,
        type,
        bankName,
        name,
        cardNumber,
        owner,
        isDefault,
      });

      return res.status(201).json({
        message: "Thêm phương thức thanh toán thành công",
        data: newMethod,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // Xóa phương thức thanh toán
  async deletePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      await PaymentMethod.findByIdAndDelete(id);
      return res.status(200).json({
        message: "Xóa phương thức thanh toán thành công",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // Đặt làm mặc định
  async setDefault(req, res) {
    try {
      const { id } = req.params;
      const method = await PaymentMethod.findById(id);
      if (!method) {
        return res.status(404).json({ message: "Không tìm thấy phương thức" });
      }

      await PaymentMethod.updateMany(
        { user_id: method.user_id },
        { isDefault: false },
      );
      method.isDefault = true;
      await method.save();

      return res.status(200).json({
        message: "Đã đặt làm mặc định thành công",
        data: method,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }
}

module.exports = new PaymentMethodController();
