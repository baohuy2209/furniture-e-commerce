const eventService = require("../../services/event.service");
const RegisterEvent = require("../models/registerEvent.model");
class RegisterEventController {
  // [POST] /api/register-events
  async registerEvents(req, res) {
    try {
      const { event_id, user_id, fullname, email, phone, note } = req.body;
      const newRegisterEvent = await RegisterEvent.create({
        event_id,
        user_id,
        fullname,
        email,
        phone,
        note,
      });
      const { data, message } =
        await eventService.increaseRegisterEvent(event_id);
      if (!data) {
        return res.status(403).json({ message, data: null });
      }
      return res.status(201).json({
        message: "Đăng kí sự kiện thành công",
        data: newRegisterEvent,
      });
    } catch (e) {
      console.error("Register Event Error:", e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e.message, data: null });
    }
  }
  // [GET] /api/register-events
  async getAllRegister(req, res) {
    try {
      const { event_id } = req.query;
      const query = event_id ? { event_id } : {};
      const listUserRegisterEvent = await RegisterEvent.find(query)
        .populate("event_id")
        .populate("user_id")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Load dữ liệu thành công",
        data: listUserRegisterEvent,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [GET] /api/register-events/:id
  async getDetailRegisterEventInfo(req, res) {
    try {
      const registerEventId = req.params.id;
      const detailRegisterEvent = await RegisterEvent.findById(registerEventId)
        .populate("event_id")
        .populate("user_id");

      if (!detailRegisterEvent) {
        return res.status(404).json({
          message: "Không tìm thấy dữ liệu",
        });
      }
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: detailRegisterEvent });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}

module.exports = new RegisterEventController();
