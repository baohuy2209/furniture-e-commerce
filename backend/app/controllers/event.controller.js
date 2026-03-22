const Event = require("../models/event.model");
const eventService = require("../../services/event.service");
const { uploadImage, generateSlug } = require("../../utils/utils");

class EventController {
  // [GET] /api/events/
  async getAllEvents(req, res) {
    try {
      const events = await Event.find({}).sort({ createdAt: -1 });
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
  // [GET] /api/events/past-event
  async getPastEvents(req, res) {
    try {
      const { data, message } = await eventService.getPastEvents();
      if (!data) {
        return res.status(404).json({ message, data });
      }
      return res.status(200).json({
        data,
        message: "Lấy dữ liệu các sự kiện thành công",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server " + error.message, data: null });
    }
  }
  // [GET] /api/events/upcoming-event
  async getUpcommingEvent(req, res) {
    try {
      const { data, message } = await eventService.getUpcommingEvents();
      if (!data) {
        return res.status(404).json({ message, data });
      }
      return res.status(200).json({
        data,
        message: "Lấy dữ liệu các sự kiện sắp diễn ra thành công",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server " + error.message, data: null });
    }
  }
  // [GET] /api/events/current-event
  async getCurrentEvent(req, res) {
    try {
      const { data, message } = await eventService.getCurrentEvents();
      if (!data) {
        return res.status(404).json({ message, data: null });
      }
      return res.status(200).json({
        data,
        message: "Lấy dữ liệu các sự kiện đang diễn ra thành công",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server", data: null });
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
        .json({ message: "Lỗi server " + error.message, data: null });
    }
  }
  // [POST] /api/events
  async createEvent(req, res) {
    try {
      const eventData = { ...req.body };

      // Xử lý slug
      if (!eventData.slug && eventData.title) {
        eventData.slug = generateSlug(eventData.title);
      }

      // Xử lý upload ảnh nếu có file
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadImage(file.path, "events"),
        );
        const uploadResults = await Promise.all(uploadPromises);
        eventData.images = uploadResults.map((result, index) => ({
          url_image: result.url,
          is_main: index === 0, // Ảnh đầu tiên làm ảnh chính mặc định
        }));
      }

      const newEvent = await Event.create(eventData);
      return res
        .status(200)
        .json({ message: "Tạo dữ liệu thành công", data: newEvent });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
  // [PATCH] /api/events/:id
  async updateEvent(req, res) {
    try {
      const eventId = req.params.id;
      const eventData = { ...req.body };

      // Xử lý slug nếu title thay đổi
      if (eventData.title && !eventData.slug) {
        eventData.slug = generateSlug(eventData.title);
      }

      // Xử lý upload ảnh mới nếu có
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadImage(file.path, "events"),
        );
        const uploadResults = await Promise.all(uploadPromises);
        const newImages = uploadResults.map((result) => ({
          url_image: result.url,
          is_main: false,
        }));

        // Option: Ghi đè hoặc append ảnh? Ở đây tôi sẽ append nếu frontend không gửi mảng images mới
        if (!eventData.images) {
          const currentEvent = await Event.findById(eventId);
          eventData.images = [...(currentEvent.images || []), ...newImages];
        } else {
          // Nếu frontend gửi mảng images (chứa URL cũ), ta merge với ảnh mới
          eventData.images = [...eventData.images, ...newImages];
        }
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { ...eventData },
        { new: true },
      );

      if (!updatedEvent) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy sự kiện nào", data: null });
      }
      return res.status(200).json({
        message: "Đã cập nhật thành công sự kiện",
        data: updatedEvent,
      });
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
      const deletedEvent = await Event.findByIdAndDelete(eventId);
      if (!deletedEvent) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy sự kiện nào", data: null });
      }
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedEvent,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}
module.exports = new EventController();
