const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const morgan = require("morgan");
const { connect } = require("./app/config/db");
const route = require("./routes/index.route");
const swaggerUi = require("swagger-ui-express");
const cookieSession = require("cookie-session");
const fs = require("fs");
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
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SECRET_KEY,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  }),
);
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
