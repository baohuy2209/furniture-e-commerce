const BlogPosts = require("../models/blogPosts.model");
const blogService = require("../../services/blog.service");
class BlogController {
  async getAll(req, res) {
    try {
      const blogs = await BlogPosts.find({});
      const { data, message } = await blogService.getListBlogInfo(blogs);
      if (!data) {
        return res
          .status(404)
          .json({ data, message: "Không tìm thấy dữ liệu" });
      }
      return res.status(200).json({ message, data });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server " + error, data: null });
    }
  }
  async getTop3ReadingBlogs(req, res) {
    try {
      const blogs = await BlogPosts.find({});
      const { data, message } = await blogService.getListBlogInfo(blogs);
      if (!data) {
        return res
          .status(404)
          .json({ data, message: "Không tìm thấy dữ liệu" });
      }
      const list3TopReadingBlogs = blogService.getTopReadingBlogs(data, 3);
      return res.status(200).json({ message, data: list3TopReadingBlogs });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server " + error, data: null });
    }
  }
  async getById(req, res) {
    res.json({ message: `Get blog post with id ${req.params.id}` });
  }
}
module.exports = new BlogController();
