const orderService = require("../../services/order.service");

class OrderController {
  // [POST] /api/orders/checkout
  async checkout(req, res) {
    try {
      const data = await orderService.checkout(req.userId, req.body);
      return res.status(200).json({ message: "Đặt hàng thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [GET] /api/orders
  async getUserOrders(req, res) {
    try {
      const data = await orderService.getUserOrders(req.userId);
      return res
        .status(200)
        .json({ message: "Lấy danh sách đơn hàng thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [GET] /api/orders/:id
  async getOrderDetail(req, res) {
    try {
      const data = await orderService.getOrderDetails(
        req.params.id,
        req.userId,
      );
      return res
        .status(200)
        .json({ message: "Lấy chi tiết đơn hàng thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [PUT] /api/orders/:id/cancel
  async cancelOrder(req, res) {
    try {
      const { cancel_reason } = req.body;
      const data = await orderService.cancelOrder(
        req.userId,
        req.params.id,
        cancel_reason,
      );
      return res.status(200).json({ message: "Hủy đơn hàng thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // ===== ADMIN APIs =====

  // [GET] /api/orders/admin/all
  async getAllOrdersAdmin(req, res) {
    try {
      const data = await orderService.getAllOrders();
      return res
        .status(200)
        .json({ message: "Lấy danh sách tất cả đơn hàng thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [GET] /api/orders/admin/:id
  async getOrderDetailAdmin(req, res) {
    try {
      const data = await orderService.getOrderDetails(req.params.id); // without userId to get any order
      return res
        .status(200)
        .json({ message: "Lấy chi tiết đơn hàng (Admin) thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [PUT] /api/orders/admin/item-status/:orderItemId
  async updateOrderItemStatus(req, res) {
    try {
      const { status } = req.body;
      const data = await orderService.updateOrderItemStatus(
        req.params.orderItemId,
        status,
      );
      return res
        .status(200)
        .json({
          message: "Cập nhật trạng thái sản phẩm trong đơn thành công",
          data,
        });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [PUT] /api/orders/admin/payment-status/:paymentId
  async updatePaymentStatus(req, res) {
    try {
      const { status } = req.body;
      const data = await orderService.updatePaymentStatus(
        req.params.paymentId,
        status,
      );
      return res
        .status(200)
        .json({ message: "Cập nhật trạng thái thanh toán thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }
}

module.exports = new OrderController();
