const BlogCategories = require("../models/blogCategories.model");
const { generateSlug } = require("../../utils/utils");

class BlogCategoriesController {
  // [GET] /api/blog-categories
  async getAllBlogCategories(req, res) {
    try {
      const listBlogCategories = await BlogCategories.find();
      return res.status(200).json({
        message: "Load dữ liệu các loại sản phẩm thành công",
        data: listBlogCategories,
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi hệ thống " + e.message, data: null });
    }
  }
  // [GET] /api/blog-categories/:id
  async getDetailBlogCategory(req, res) {
    try {
      const blogCategoryId = req.params.id;
      const blogCategoryDetail = await BlogCategories.findById(blogCategoryId);
      return res.status(200).json({
        messsage: "Load dữ liệu thành công",
        data: blogCategoryDetail,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [POST] /api/blog-categories
  async createNewBlogCategories(req, res) {
    try {
      const { name, description } = req.body;
      const slug = generateSlug(name);
      const newBlogCategories = new BlogCategories({
        name,
        slug,
        description,
      });
      await newBlogCategories.save();
      return res.status(200).json({
        message: "Tạo loại sản phẩm mới thành công",
        data: newBlogCategories,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [PATCH] /api/blog-categories/:id
  async updateBlogCategory(req, res) {
    try {
      const blogCategoryId = req.params.id;
      const updatedBlogCategory = await BlogCategories.findByIdAndUpdate(
        blogCategoryId,
        req.body,
      );
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedBlogCategory,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [DELETE] /api/blog-categories/:id
  async deleteBlogCategory(req, res) {
    try {
      const blogCategoryId = req.params.id;
      const deletedBlogCategory =
        await BlogCategories.findByIdAndDelete(blogCategoryId);
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedBlogCategory,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}
module.exports = new BlogCategoriesController();
