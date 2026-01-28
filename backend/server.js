const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const morgan = require("morgan");
const { connect } = require("./app/config/db");
const route = require("./routes/index.route");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const errorHandler = require("./middlewares/errrorHandler");
dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorHandler());
app.get("/", (req, res) => {
  res.send("Welcome to furniture e-commerce");
});
const swaggerDocument = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
connect();
route(app);
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
