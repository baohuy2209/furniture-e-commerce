const Brand = require("../models/brand.model");
class BrandController {
  // [GET] /api/brands
  async getAllBrands(req, res) {
    try {
      const listBrand = await Brand.find();
      return res.status(200).json({
        message: "Load dữ liệu thành công",
        data: listBrand,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/brands/:id
  async getBrandDetails(req, res) {
    try {
      const brandId = req.params.id;
      const brandDetail = await Brand.findById(brandId);
      return res.status(200).json({
        messsage: "Load dữ liệu thành công",
        data: brandDetail,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [POST] /api/brands/
  async createNewBrand(req, res) {
    try {
      const { name, address, phone, contact_email } = req.body;
      const newBrand = new Brand({
        name,
        address,
        phone,
        contact_email,
      });
      await newBrand.save();
      return res.status(200).json({
        message: "Tạo nhà cung cấp mới thành công",
        data: newBrand,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [PATCH] /api/brands/:id
  async updateInfoBrand(req, res) {
    try {
      const brandId = req.params.id;
      const updatedBrand = await Brand.findByIdAndUpdate(brandId, req.body);
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedBrand,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [DELETE] /api/brands/:id
  async deleteBrand(req, res) {
    try {
      const brandId = req.params.id;
      const deletedBrand = await Brand.findByIdAndDelete(brandId);
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedBrand,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}

module.exports = new BrandController();
