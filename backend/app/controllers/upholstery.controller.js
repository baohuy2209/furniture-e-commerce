const Upholstery = require("../models/upholstery.model");
class UpholsteryController {
  // [GET] /api/upholstery
  async getAllUpholstery(req, res) {
    try {
      const listUpholsteries = await Upholstery.find();
      return res.status(200).json({
        message: "Load dữ liệu các loại sản phẩm thành công",
        data: listUpholsteries,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [POST] /api/ulphostery
  async createNewUpholstery(req, res) {
    try {
      const { name, fabric_name, color, material, image } = req.body;
      const newUpholstery = new Upholstery({
        name,
        fabric_name,
        color,
        material,
        image,
      });
      await newUpholstery.save();
      return res.status(200).json({
        message: "Tạo loại sản phẩm mới thành công",
        data: newUpholstery,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [GET] /api/ulphostery/:id
  async getDetailUpholstery(req, res) {
    try {
      const upholsteryId = req.params.id;
      const upholsteryDetail = await Upholstery.findById(upholsteryId);
      return res.status(200).json({
        messsage: "Load dữ liệu thành công",
        data: upholsteryDetail,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [PATCH] /api/ulphostery/:id
  async updateUpholstery(req, res) {
    try {
      const upholsteryId = req.params.id;
      const updatedUpholstery = await Upholstery.findByIdAndUpdate(
        upholsteryId,
        req.body,
      );
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedUpholstery,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [DELETE] /api/uphostery/:id
  async deleteUpholstery(req, res) {
    try {
      const upholsteryId = req.params.id;
      const deletedUpholstery =
        await Upholstery.findByIdAndDelete(upholsteryId);
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedUpholstery,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}

module.exports = new UpholsteryController();
