const fs = require("fs");
const path = require("path");
const { connect } = require("../app/config/db/index");
const BlogTags = require("../app/models/BlogTags.model");

const DATA_PATH = path.join(__dirname, "./BlogTags.json");

async function seed() {
  try {
    await connect();
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(rawData);
    await BlogTags.deleteMany({}); 
    await BlogTags.create(data);
    console.log("✅ Seed BlogTags xong!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed BlogTags:", err);
    process.exit(1);
  }
}
seed();