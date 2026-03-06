const CustomerInquiry = require("../models/customerInquiries.model");

class CustomerInquiryController {
    // [POST] /api/inquiries
    async createTicket(req, res) {
        try {
            const { user_id, subject, message } = req.body;
            const newTicket = new CustomerInquiry({
                user_id,
                subject,
                message,
            });
            await newTicket.save();
            return res.status(200).json({
                message: "Tạo ticket hỗ trợ thành công",
                data: newTicket,
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
        }
    }

    // [GET] /api/inquiries/user/:user_id
    async getUserTickets(req, res) {
        try {
            const userId = req.params.user_id;
            const tickets = await CustomerInquiry.find({ user_id: userId });
            return res.status(200).json({
                message: "Lấy danh sách ticket thành công",
                data: tickets,
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
        }
    }
}

module.exports = new CustomerInquiryController();
