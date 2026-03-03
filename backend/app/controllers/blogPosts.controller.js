class BlogController {
  getAll(req, res) {
    res.json({ message: "Get all blog posts" });
  }
  getById(req, res) {
    res.json({ message: `Get blog post with id ${req.params.id}` });
  }
}
module.exports = new BlogController();
