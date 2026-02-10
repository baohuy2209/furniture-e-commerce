const authRoute = require("./authentication.routes");
function route(app) {
  app.use("/api/auth", authRoute);
}
module.exports = route;
