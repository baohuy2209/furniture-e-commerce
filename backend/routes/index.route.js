const authRoute = require("./authentication.routes");
const productRoute = require("./product.routes");
const blogRoute = require("./blog.routes");
const eventRoute = require("./event.route");
const userRoute = require("./user.route");
const productCategoryRoute = require("./productCategory.routes");
const productTagsRoute = require("./productTag.routes");
const brandRoute = require("./brand.routes");
const blogAuthorRoute = require("./blogAuthor.routes");
function route(app) {
  app.use("/api/auth", authRoute);
  app.use("/api/products", productRoute);
  app.use("/api/blogs", blogRoute);
  app.use("/api/events", eventRoute);
  app.use("/api/user", userRoute);
  app.use("/api/product-categories", productCategoryRoute);
  app.use("/api/product-tags", productTagsRoute);
  app.use("/api/brands", brandRoute);
  app.use("/api/blog-author", blogAuthorRoute);
}
module.exports = route;
