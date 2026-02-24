const authRoute = require("./authentication.routes");
const productRoute = require("./product.routes");
const blogRoute = require("./blog.routes");
function route(app) {
  app.use("/api/auth", authRoute);
  app.use("/api/products", productRoute);
  app.use("/api/blogs", blogRoute);
}
module.exports = route;
