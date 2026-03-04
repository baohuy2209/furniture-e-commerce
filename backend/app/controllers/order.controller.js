const Order = require("../models/order.model");

class OrderController {
    // Lấy danh sách đơn hàng của người dùng
    async getOrdersByUserId(req, res) {
        try {
            const { user_id } = req.params;
            const orders = await Order.find({ user_id }).sort({ createdAt: -1 });
            return res.status(200).json({
                message: "Lấy danh sách đơn hàng thành công",
                data: orders,
            });
        } catch (error) {
            return res.status(500).json({
                message: "Lỗi Server khi lấy danh sách đơn hàng",
                error: error.message,
            });
        }
    }

    // Lấy chi tiết một đơn hàng
    async getOrderDetail(req, res) {
        try {
            const { id } = req.params;
            const order = await Order.findById(id);
            if (!order) {
                return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
            }
            return res.status(200).json({
                message: "Lấy chi tiết đơn hàng thành công",
                data: order,
            });
        } catch (error) {
            return res.status(500).json({
                message: "Lỗi Server khi lấy chi tiết đơn hàng",
                error: error.message,
            });
        }
    }
}

module.exports = new OrderController();
