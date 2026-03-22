const BlogCategories = require("../app/models/blogCategories.model");
class BlogService {
  async getListBlogInfo(blogs) {
    const listBlogInfo = await Promise.all(
      blogs.map(async (blog) => {
        const categories = await BlogCategories.findById(blog.categories);
        return {
          _id: blog._id,
          title: blog.title,
          thumbnail_url: blog.thumbnail_url,
          description: blog.description,
          activity: blog.activity,
          categories: categories ? categories.name : "Cảm hứng Decor",
          time_reads: blog.time_reads,
          publishedAt: blog.publishedAt,
        };
      }),
    );
    return { data: listBlogInfo, message: "Lấy dữ liệu thành công" };
  }
  getTopReadingBlogs(blogs, limit = 3) {
    return blogs
      .sort((a, b) => b.activity.total_reads - a.activity.total_reads)
      .slice(0, limit);
  }
}
module.exports = new BlogService();
