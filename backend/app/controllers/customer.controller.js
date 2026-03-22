const customerService = require("../../services/customer.service");

class CustomerController {
  // [GET] /api/admins/customers/statistics
  async getStatistics(req, res) {
    try {
      const stats = await customerService.getCustomerStats();
      return res.status(200).json({
        message: "Lấy thống kê khách hàng thành công",
        data: stats
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server: " + error.message,
        data: null
      });
    }
  }

  // [GET] /api/admins/customers
  async getCustomers(req, res) {
    try {
      const data = await customerService.getCustomers(req.query);
      return res.status(200).json({
        message: "Lấy danh sách khách hàng thành công",
        data
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server: " + error.message,
        data: null
      });
    }
  }

  // [GET] /api/admins/customers/:id
  async getCustomerDetail(req, res) {
    try {
      const data = await customerService.getCustomerDetails(req.params.id);
      return res.status(200).json({
        message: "Lấy chi tiết khách hàng thành công",
        data
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server: " + error.message,
        data: null
      });
    }
  }

  // [GET] /api/admins/customers/:id/orders
  async getCustomerOrders(req, res) {
    try {
      const data = await customerService.getCustomerOrders(req.params.id);
      return res.status(200).json({
        message: "Lấy lịch sử đơn hàng của khách hàng thành công",
        data
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server: " + error.message,
        data: null
      });
    }
  }

  // [GET] /api/admins/customers/:id/points
  async getCustomerPoints(req, res) {
    try {
      const data = await customerService.getCustomerPointsHistory(req.params.id);
      return res.status(200).json({
        message: "Lấy lịch sử điểm của khách hàng thành công",
        data
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server: " + error.message,
        data: null
      });
    }
  }

  // [PATCH] /api/admins/customers/:id/status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const data = await customerService.updateCustomerStatus(req.params.id, status);
      return res.status(200).json({
        message: "Cập nhật trạng thái khách hàng thành công",
        data
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server: " + error.message,
        data: null
      });
    }
  }
}

module.exports = new CustomerController();
