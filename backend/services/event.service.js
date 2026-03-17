const Event = require("../app/models/event.model");
class EventService {
  async getPastEvents() {
    try {
      const listPastEvents = await Event.find({
        "date_range.endDate": { $lt: new Date() },
      });
      return {
        message: "Lấy dữ liệu thành công",
        data: listPastEvents.slice(0, 6),
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server " + e.message, data: null };
    }
  }
  async getUpcommingEvents() {
    try {
      const listUpcommingEvents = await Event.find({
        "date_range.startDate": { $gt: new Date() },
      });
      return {
        message: "Lấy dữ liệu thành công",
        data: listUpcommingEvents,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server " + e.message, data: null };
    }
  }
  async getCurrentEvents() {
    try {
      const happeningEvents = await Event.find({
        "date_range.startDate": { $lt: new Date() },
        "date_range.endDate": { $gt: new Date() },
      });
      return {
        message: "Lấy dữ liệu thành công",
        data: happeningEvents,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server " + e.message, data: null };
    }
  }
}
module.exports = new EventService();
