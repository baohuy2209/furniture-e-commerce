const fs = require("fs");
const path = require("path");
const { connect } = require("../app/config/db/index");
const BlogCategories = require("../app/models/BlogCategories.model");

const DATA_PATH = path.join(__dirname, "./BlogCategories.json");

async function seed() {
  try {
    await connect();
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(rawData);
    await BlogCategories.deleteMany({}); 
    await BlogCategories.create(data);
    console.log("✅ Seed BlogCategories xong!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed Categories:", err);
    process.exit(1);
  }
}
seed();