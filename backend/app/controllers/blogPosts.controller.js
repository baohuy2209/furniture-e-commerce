const BlogPosts = require("../models/blogPosts.model");
const blogService = require("../../services/blog.service");
const { getPagination } = require("../../utils/utils");

class BlogController {
  // [GET] /api/blogs
  async getAll(req, res) {
    try {
      const { page, size } = req.query;
      const { limit, offset } = getPagination(page, size);
      const blogs = await BlogPosts.paginate({}, { offset, limit });
      const { data, message } = await blogService.getListBlogInfo(blogs.docs);
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
  // [GET] /api/blogs/trending-blogs
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
  // [GET] /api/blogs/:id
  async getById(req, res) {
    try {
      const blogId = req.params.id;
      const detailBlog = await BlogPosts.findById(blogId);
      if (!detailBlog) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy bài viết", data: null });
      }
      return res
        .status(200)
        .json({ message: "Load dữ liệu thành công", data: detailBlog });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server " + error, data: null });
    }
  }
  // [GET] /api/blogs/related-blog/:id
  async getRelatedBlogs(req, res) {
    try {
      const categoryId = req.params.id;
      const blogs = await BlogPosts.find({ categories: categoryId });
      console.log(blogs, categoryId);
      const { data, message } = await blogService.getListBlogInfo(blogs);
      if (!data) {
        return res
          .status(404)
          .json({ data: null, message: "Không tìm thấy dữ liệu" });
      }
      return res.status(200).json({ message, data });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server " + error, data: null });
    }
  }
}
module.exports = new BlogController();
