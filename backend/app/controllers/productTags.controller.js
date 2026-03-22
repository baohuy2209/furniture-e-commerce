const ProductTags = require("../models/productTags.model");
const { generateSlug } = require("../../utils/utils");

class ProductTagsController {
  // [GET] /api/product-tags
  async getAllProductTags(req, res) {
    try {
      const listProductTags = await ProductTags.find();
      return res.status(200).json({
        message: "Load dữ liệu thành công ",
        data: listProductTags,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [POST] /api/product-tags/
  async createNewProductTags(req, res) {
    try {
      const { name, description } = req.body;
      const slug = generateSlug(name);
      const newProductTags = new ProductTags({
        name,
        slug,
        description,
      });
      await newProductTags.save();
      return res.status(200).json({
        message: "Tạo thẻ sản phẩm mới thành công",
        data: newProductTags,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [PATCH] /api/product-tags/:id
  async updateProductTags(req, res) {
    try {
      const productTagsId = req.params.id;
      const updatedProductTag = await ProductTags.findByIdAndUpdate(
        productTagsId,
        req.body,
      );
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedProductTag,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }

  // [DELETE] /api/product-tags/:id
  async deleteProductTags(req, res) {
    try {
      const productTagId = req.params.id;
      const deletedProductTags =
        await ProductTags.findByIdAndDelete(productTagId);
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedProductTags,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}

module.exports = new ProductTagsController();
