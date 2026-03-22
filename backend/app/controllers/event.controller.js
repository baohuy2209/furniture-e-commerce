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
      const {
        title,
        description,
        category,
        start_at,
        end_at,
        location_name,
        address,
        city,
        capacity,
        status,
        highlights,
        schedule,
      } = req.body;

      // Ánh xạ dữ liệu sang cấu trúc Model
      const eventData = {
        title,
        description,
        category,
        status: status?.toUpperCase(),
        date_range: {
          startDate: start_at ? new Date(start_at) : undefined,
          endDate: end_at ? new Date(end_at) : undefined,
        },
        location: {
          name: location_name,
          address,
          city,
        },
        registration: {
          maxSlot: Number(capacity || 0),
        },
        hightlight_des: Array.isArray(highlights)
          ? highlights
          : highlights
            ? JSON.parse(highlights)
            : [],
        timeline_event: Array.isArray(schedule)
          ? schedule
          : schedule
            ? JSON.parse(schedule)
            : [],
      };

      // Xử lý slug
      if (!eventData.slug && title) {
        eventData.slug = generateSlug(title);
      }

      // Xử lý upload ảnh nếu có file
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadImage(file.path, "events"),
        );
        const uploadResults = await Promise.all(uploadPromises);
        eventData.images = uploadResults.map((result, index) => ({
          url_image: result.url,
          is_main: index === 0,
        }));
      }

      const newEvent = await Event.create(eventData);
      return res
        .status(201)
        .json({ message: "Tạo dữ liệu sự kiện thành công", data: newEvent });
    } catch (error) {
      console.error("Create Event Error:", error);
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message });
    }
  }
  // [PATCH] /api/events/:id
  async updateEvent(req, res) {
    try {
      const eventId = req.params.id;
      const {
        title,
        description,
        category,
        start_at,
        end_at,
        location_name,
        address,
        city,
        capacity,
        status,
        highlights,
        schedule,
      } = req.body;

      // Chuẩn bị dữ liệu update (ánh xạ nếu trường đó tồn tại trong req.body)
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (status !== undefined) updateData.status = status.toUpperCase();

      if (start_at !== undefined || end_at !== undefined) {
        updateData.date_range = {};
        if (start_at) updateData.date_range.startDate = new Date(start_at);
        if (end_at) updateData.date_range.endDate = new Date(end_at);
      }

      if (location_name !== undefined || address !== undefined || city !== undefined) {
        updateData.location = {};
        if (location_name) updateData.location.name = location_name;
        if (address) updateData.location.address = address;
        if (city) updateData.location.city = city;
      }

      if (capacity !== undefined) {
        updateData.registration = { maxSlot: Number(capacity) };
      }

      if (highlights !== undefined) {
        updateData.hightlight_des = Array.isArray(highlights)
          ? highlights
          : JSON.parse(highlights);
      }

      if (schedule !== undefined) {
        updateData.timeline_event = Array.isArray(schedule)
          ? schedule
          : JSON.parse(schedule);
      }

      // Xử lý slug nếu title thay đổi
      if (title && !req.body.slug) {
        updateData.slug = generateSlug(title);
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

        // Append ảnh mới vào danh sách hiện tại
        const currentEvent = await Event.findById(eventId);
        updateData.images = [...(currentEvent.images || []), ...newImages];
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $set: updateData },
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
      console.error("Update Event Error:", error);
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message });
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
