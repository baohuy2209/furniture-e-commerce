const Event = require("../models/event.model");
const eventService = require("../../services/event.service");
const cloudinary = require("../config/cloudinary");

async function uploadImages(images) {
  if (!images || !Array.isArray(images)) return;
  for (let img of images) {
    if (img.url_image && img.url_image.startsWith("data:image")) {
      try {
        const result = await cloudinary.uploader.upload(img.url_image, {
          folder: "events",
        });
        img.url_image = result.secure_url;
      } catch (error) {
        console.error("Cloudinary upload failed", error);
      }
    }
  }
}

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
      await uploadImages(req.body.images);
      const newEvent = await Event.create(req.body);
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
      await uploadImages(req.body.images);
      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { ...req.body },
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
      const deleteEvent = await Event.findByIdAndDelete(eventId);
      if (!deleteEvent) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy sự kiện nào", data: null });
      }
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
