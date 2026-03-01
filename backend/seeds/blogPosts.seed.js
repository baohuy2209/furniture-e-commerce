const fs = require("fs");
const path = require("path");
const { connect } = require("../app/config/db/index");
const BlogPosts = require("../app/models/BlogPosts.model");

const DATA_PATH = path.join(__dirname, "./BlogPosts.json");

async function seed() {
  try {
    await connect();
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(rawData);
    await BlogPosts.deleteMany({}); 
    await BlogPosts.create(data);
    console.log("✅ Seed BlogPosts xong!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed BlogPosts:", err);
    process.exit(1);
  }
}
seed();