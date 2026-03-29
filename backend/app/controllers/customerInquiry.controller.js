const CustomerInquiry = require("../models/customerInquiries.model");
const { sendEmail } = require("../../utils/email");
const fs = require("fs");
const path = require("path");

class CustomerInquiryController {
  // [POST] /api/inquiries
  async createTicket(req, res) {
    try {
      const userId = req.userId;
      const { category, subject, message } = req.body;

      // Hạn phản hồi mặc định là 24h
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 24);

      const newTicket = new CustomerInquiry({
        user_id: userId,
        category,
        subject,
        message,
        due_date: dueDate,
      });
      await newTicket.save();
      return res.status(200).json({
        message: "Tạo ticket hỗ trợ thành công",
        data: newTicket,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }

  // [GET] /api/inquiries/user
  async getUserTickets(req, res) {
    try {
      const userId = req.userId;
      const tickets = await CustomerInquiry.find({ user_id: userId }).sort({
        createdAt: -1,
      });
      return res.status(200).json({
        message: "Lấy danh sách ticket thành công",
        data: tickets,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }

  // Admin section
  // [GET] /api/inquiries
  async getAllTickets(req, res) {
    try {
      const { status, priority, category } = req.query;

      let query = {};
      if (status && status !== "all") query.status = status;
      if (priority && priority !== "all") query.priority = priority;
      if (category && category !== "all") query.category = category;

      const tickets = await CustomerInquiry.find(query)
        .populate("user_id", "name email phone")
        .populate("resolving_staff_id", "name")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Lấy tất cả ticket thành công",
        data: tickets,
      });
    } catch (e) {
      return res.status(500).json({ message: "Lỗi hệ thống: " + e.message });
    }
  }

  // [GET] /api/inquiries/:id
  async getTicketById(req, res) {
    try {
      const ticket = await CustomerInquiry.findById(req.params.id)
        .populate("user_id", "name email phone")
        .populate("resolving_staff_id", "name");

      if (!ticket) {
        return res.status(404).json({ message: "Không tìm thấy ticket" });
      }

      return res.status(200).json({
        message: "Lấy thông tin ticket thành công",
        data: ticket,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e });
    }
  }

  // [PATCH] /api/inquiries/respond/:id
  async respondToTicket(req, res) {
    try {
      const { id } = req.params;
      const {
        staff_response,
        internal_notes,
        status,
        priority,
        resolving_staff_id,
        send_email,
      } = req.body;

      const ticket = await CustomerInquiry.findById(id).populate(
        "user_id",
        "name email",
      );
      if (!ticket) {
        return res.status(404).json({ message: "Không tìm thấy ticket" });
      }

      // Update fields
      if (staff_response) ticket.staff_response = staff_response;
      if (internal_notes) ticket.internal_notes = internal_notes;
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (resolving_staff_id) ticket.resolving_staff_id = resolving_staff_id;

      await ticket.save();

      // Gửi email cho khách nếu có yêu cầu
      if (
        send_email &&
        ticket.user_id &&
        ticket.user_id.email &&
        staff_response
      ) {
        try {
          const templatePath = path.join(
            __dirname,
            "../../templates/support-response-template.html",
          );
          let html = fs.readFileSync(templatePath, "utf8");

          html = html
            .replace(
              "{{customerName}}",
              (ticket.user_id && ticket.user_id.name) || "Quý khách",
            )
            .replace("{{subject}}", ticket.subject)
            .replace("{{inquiryId}}", ticket._id)
            .replace("{{customerMessage}}", ticket.message)
            .replace("{{staffResponse}}", staff_response);

          await sendEmail(
            ticket.user_id.email,
            `[HomeBase] Phản hồi yêu cầu hỗ trợ: ${ticket.subject}`,
            html,
          );
        } catch (mailError) {
          console.error("Lỗi khi gửi mail: ", mailError);
          // Vẫn lưu ticket thành công nhưng báo lỗi gửi mail
          return res.status(200).json({
            message: "Đã cập nhật ticket nhưng có lỗi khi gửi email",
            data: ticket,
            mailError: mailError.message,
          });
        }
      }

      return res.status(200).json({
        message: "Cập nhật phản hồi thành công",
        data: ticket,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e });
    }
  }

  // [DELETE] /api/inquiries/:id
  async deleteTicket(req, res) {
    try {
      await CustomerInquiry.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Xóa ticket thành công" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e });
    }
  }
}

module.exports = new CustomerInquiryController();
