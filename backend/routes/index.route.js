const authRoute = require("./authentication.routes");
const reportRoute = require("./report.routes");

function route(app) {
  app.use("/api/auth", authRoute);
  app.use("/api/reports", reportRoute);
}
module.exports = route;
