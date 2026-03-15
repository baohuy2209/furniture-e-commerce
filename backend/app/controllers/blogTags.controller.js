const BlogTags = require("../models/blogTags.model");
const { generateSlug } = require("../../utils/utils");

class BlogTagsController {
  // [GET] /api/blog-tags
  async getAllBlogTags(req, res) {
    try {
      const listBlogTags = await BlogTags.find();
      return res.status(200).json({
        message: "Load dữ liệu thành công",
        data: listBlogTags,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [POST] /api/blog-tags
  async createNewBlogTags(req, res) {
    try {
      const { name, description } = req.body;
      const slug = generateSlug(name);
      const newBlogTags = new BlogTags({
        name,
        slug,
        description,
      });
      await newBlogTags.save();
      return res.status(200).json({
        message: "Tạo thẻ sản phẩm mới thành công",
        data: newBlogTags,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [GET] /api/blog-tags/:id
  async getDetailBlogTags(req, res) {
    try {
      const blogTagsId = req.params.id;
      const updatedBlogTag = await BlogTags.findByIdAndUpdate(
        blogTagsId,
        req.body,
      );
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedBlogTag,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [PATCH] /api/blog-tags/:id
  async updateBlogTags(req, res) {
    try {
      const blogTagId = req.params.id;
      const { name, description } = req.body;
      const newSlug = generateSlug(name);
      const updatedBlogTag = await BlogTags.findByIdAndUpdate(blogTagId, {
        name,
        slug: newSlug,
        description,
      });
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedBlogTag,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [DELETE] /api/blog-tags/:id
  async deleteBlogTags(req, res) {
    try {
      const blogTagId = req.params.id;
      const deletedBlogTag = await BlogTags.findByIdAndDelete(blogTagId);
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedBlogTag,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
}
module.exports = new BlogTagsController();
