const BlogAuthor = require("../models/blogAuthor.model");
class BlogAuthorController {
  // [GET] /api/blog-author
  async getAllBlogAuthor(req, res) {
    try {
      const blogAuthors = await BlogAuthor.find({});
      return res.status(200).json({
        data: blogAuthors,
        message: "Lấy dữ liệu các sự kiện thành công",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
  // [GET] /api/blog-author/:id
  async getDetailAuthor(req, res) {
    try {
      const blogAuthorId = req.params.id;
      const detailAuthor = await BlogAuthor.findById(blogAuthorId);
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: detailAuthor });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
}
module.exports = new BlogAuthorController();
