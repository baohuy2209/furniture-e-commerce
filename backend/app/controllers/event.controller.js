const Event = require("../models/event.model");
class EventController {
  // [GET] /api/events/
  async getAllEvents(req, res) {
    try {
      const events = await Event.find({});
      return res.status(200).json({
        data: events,
        message: "Lấy dữ liệu các sự kiện thành công",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
  // [GET] /api/events/:id
  async getDetailEvent(req, res) {
    try {
      const eventId = req.params.id;
      const detailEvent = await Event.findById(eventId);
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: detailEvent });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
  // [DELETE] /api/events/:id
  async deleteEvent(req, res) {
    try {
      const eventId = req.params.id;
      const deleteEvent = await Event.findByIdAndDelete(eventId);
      return res.status(200).json({
        messsage: "Xóa dữ liệu thành công",
        data: deleteEvent,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}
module.exports = new EventController();
