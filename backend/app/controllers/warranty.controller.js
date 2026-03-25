const WarrantyRequest = require("../models/warrantyRequests.model");
const WarrantyImage = require("../models/warrantyImage.model");
const { uploadImage } = require("../../utils/utils");

class WarrantyController {
  // [POST] /api/warranties
  async createWarrantyRequest(req, res) {
    try {
      const userId = req.userId;
      const {
        fullname,
        email,
        phone,
        issue_description,
        product_variant_id,
        order_id,
        order_item_id,
        warranty_method,
        warranty_reasons,
      } = req.body;

      const newRequest = new WarrantyRequest({
        user_id: userId,
        fullname,
        email,
        phone,
        issue_description,
        product_variant_id,
        order_id,
        order_item_id,
        warranty_method,
        warranty_reasons,
        request_date: new Date(),
      });
      await newRequest.save();

      // Xử lý upload ảnh nếu có file từ multer
      let finalImages = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadImage(file.path, "warranties"),
        );
        const uploadResults = await Promise.all(uploadPromises);
        finalImages = uploadResults.map((result) => result.url);
      } else if (req.body.images) {
        // Fallback cho trường hợp frontend vẫn gửi URL (nếu có)
        const images = req.body.images;
        finalImages = images.map((img) => img.url || img);
      }

      if (finalImages.length > 0) {
        const newImages = new WarrantyImage({
          warranty_request_id: newRequest._id,
          image_url: finalImages,
        });
        await newImages.save();
      }

      return res.status(201).json({
        message: "Gửi yêu cầu bảo hành thành công",
        data: newRequest,
      });
    } catch (e) {
      console.error("Create Warranty Error:", e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e.message, data: null });
    }
  }

  // [GET] /api/warranties/user
  async getUserWarranties(req, res) {
    try {
      const userId = req.userId;
      const warranties = await WarrantyRequest.find({
        user_id: userId,
      });
      return res.status(200).json({
        message: "Lấy danh sách bảo hành thành công",
        data: warranties,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống: " + e, data: null });
    }
  }

  // Admin section
  // [GET] /api/warranties
  async getAllWarranties(req, res) {
    try {
      // Basic pagination logic could be added here if needed
      const warranties = await WarrantyRequest.find()
        .populate("user_id")
        .populate("product_variant_id")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Lấy danh sách tất cả bảo hành thành công",
        data: warranties,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e });
    }
  }

  // [GET] /api/warranties/:id
  async getWarrantyDetail(req, res) {
    try {
      const { id } = req.params;
      const warranty = await WarrantyRequest.findById(id)
        .populate("user_id")
        .populate("product_variant_id");

      if (!warranty) {
        return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
      }

      const images = await WarrantyImage.findOne({ warranty_request_id: id });

      return res.status(200).json({
        message: "Lấy chi tiết thành công",
        data: {
          ...warranty.toObject(),
          images: images ? images.image_url : [],
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e });
    }
  }

  // [PATCH] /api/warranties/:id
  async updateWarrantyStatus(req, res) {
    try {
      const { id } = req.params;
      const { warranty_status, resolution_note, approved_by } = req.body;

      const updateData = {
        warranty_status,
        resolution_note,
      };

      if (warranty_status === "resolved" || warranty_status === "rejected") {
        updateData.completed_date = new Date();
        updateData.approved_date = new Date();
        updateData.approved_by = approved_by;
      }

      const updatedWarranty = await WarrantyRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      );

      if (!updatedWarranty) {
        return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
      }

      return res.status(200).json({
        message: "Cập nhật trạng thái bảo hành thành công",
        data: updatedWarranty,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e });
    }
  }
  async deleteWarranty(req, res) {
    try {
      const { id } = req.params;

      const warranty = await WarrantyRequest.findByIdAndDelete(id);
      const warrantyImages = await WarrantyImage.find({
        warranty_request_id: id,
      });
      warrantyImages.forEach((image) => {
        image.remove();
      });
      if (!warranty) {
        return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
      }

      return res.status(200).json({
        message: "Xóa yêu cầu bảo hành thành công",
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống: " + e });
    }
  }
}

module.exports = new WarrantyController();
