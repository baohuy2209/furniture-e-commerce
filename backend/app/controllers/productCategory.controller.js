const ProductCategory = require("../models/productCategory.model");
const { generateSlug } = require("../../utils/utils");
class ProductCategoryController {
  // [GET] /api/product-categories
  async getAllProductCategories(req, res) {
    try {
      const listProductCategories = await ProductCategory.find();
      return res.status(200).json({
        message: "Load dữ liệu các loại sản phẩm thành công",
        data: listProductCategories,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/product-categories/product_type
  async getAllProductTypeCategories(req, res) {
    try {
      const listProductCategories = await ProductCategory.find({
        type: "product_type",
      });
      return res.status(200).json({
        message: "Load dữ liệu các loại sản phẩm thành công",
        data: listProductCategories,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/product-categories/:id
  async getProductCategoryDetail(req, res) {
    try {
      const productCategoryId = req.params.id;
      const productCategoryDetail =
        await ProductCategory.findById(productCategoryId);
      return res.status(200).json({
        messsage: "Load dữ liệu thành công",
        data: productCategoryDetail,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [POST] /api/product-categories/
  async createNewProductCategory(req, res) {
    try {
      const { name, type } = req.body;
      const slug = generateSlug(name);
      const newProductCategory = new ProductCategory({
        name,
        slug,
        type,
      });
      await newProductCategory.save();
      return res.status(200).json({
        message: "Tạo loại sản phẩm mới thành công",
        data: newProductCategory,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [PATCH] /api/product-categories/:id
  async updateProductCategory(req, res) {
    try {
      const productCategoryId = req.params.id;
      const updatedProductCategory = await ProductCategory.findByIdAndUpdate(
        productCategoryId,
        req.body,
      );
      if (!updatedProductCategory) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedProductCategory,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }

  // [DELETE] /api/product-categories/:id
  async deleteProductCategory(req, res) {
    try {
      const productCategoryId = req.params.id;
      const deletedProductCategory =
        await ProductCategory.findByIdAndDelete(productCategoryId);
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedProductCategory,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}

module.exports = new ProductCategoryController();
