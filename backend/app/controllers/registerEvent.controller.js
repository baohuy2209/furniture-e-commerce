const RegisterEvent = require("../models/registerEvent.model");
class RegisterEventController {
  // [POST] /api/register-events
  async registerEvents(req, res) {
    try {
      const newRegisterEvent = await RegisterEvent.create(req.body);
      return res.status(200).json({
        message: "Đăng kí sự kiện thành công",
        data: newRegisterEvent,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [GET] /api/register-events
  async getAllRegister(req, res) {
    try {
      const listUserRegisterEvent = await RegisterEvent.find();
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
      const detailRegisterEvent = await RegisterEvent.findById(registerEventId);
      if (detailRegisterEvent) {
        return res.status(404).json({
          message: "Không tìm tháy dữ liệu",
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
