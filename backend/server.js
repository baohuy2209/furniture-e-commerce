const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const morgan = require("morgan");
const { connect } = require("./app/config/db");
const route = require("./routes/index.route");
const swaggerUi = require("swagger-ui-express");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
dotenv.config({
  path: require("path").resolve(__dirname, ".env"),
});
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SECRET_KEY || "SECRET_KEY_FALLBACK_FOR_TESTING",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  }),
);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.send("Welcome to furniture e-commerce");
});
const swaggerDocument = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/provinces", async (req, res) => {
  const data = await fetch("https://provinces.open-api.vn/api/v2/p/");
  const json = await data.json();
  res.json(json);
});
app.get("/provinces/:id", async (req, res) => {
  const id = req.params.id;
  const data = await fetch(
    `https://provinces.open-api.vn/api/v2/p/${id}?depth=2`,
  );
  const json = await data.json();
  res.json(json);
});
connect();
route(app);
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
module.exports = { cloudinary };
