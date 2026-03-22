const orderAdminService = require("../../services/orderAdmin.service");

class OrderAdminController {
  async getStatistics(req, res) {
    try {
      const stats = await orderAdminService.getStatistics();
      return res.status(200).json({
        message: "Lấy thống kê đơn hàng thành công",
        data: stats,
      });
    } catch (error) {
      console.error("OrderAdminController Error:", error);
      return res.status(500).json({ message: "Lỗi server: " + error.message });
    }
  }

  async getAllOrders(req, res) {
    try {
      const data = await orderAdminService.getAllOrders(req.query);
      return res.status(200).json({
        message: "Lấy danh sách đơn hàng admin thành công",
        data,
      });
    } catch (error) {
      console.error("OrderAdminController Error:", error);
      return res.status(500).json({ message: "Lỗi server: " + error.message });
    }
  }

  async getOrderDetail(req, res) {
    try {
      const data = await orderAdminService.getOrderDetail(req.params.id);
      return res.status(200).json({
        message: "Lấy chi tiết đơn hàng admin thành công",
        data,
      });
    } catch (error) {
      console.error("OrderAdminController Error:", error);
      return res.status(500).json({ message: "Lỗi server: " + error.message });
    }
  }

  async updateOrderNote(req, res) {
    try {
      const { admin_note } = req.body;
      const data = await orderAdminService.updateOrderNote(req.params.id, admin_note);
      return res.status(200).json({
        message: "Cập nhật ghi chú nội bộ thành công",
        data,
      });
    } catch (error) {
      console.error("OrderAdminController Error:", error);
      return res.status(500).json({ message: "Lỗi server: " + error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const data = await orderAdminService.updateOrderStatus(req.params.id, status);
      return res.status(200).json({
        message: "Cập nhật trạng thái đơn hàng thành công",
        data,
      });
    } catch (error) {
      console.error("OrderAdminController Error:", error);
      return res.status(500).json({ message: "Lỗi server: " + error.message });
    }
  }
}

module.exports = new OrderAdminController();
