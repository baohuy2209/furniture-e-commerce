const fs = require("fs");
const path = require("path");
const { connect } = require("../app/config/db/index");
const BlogAuthor = require("../app/models/blogAuthor.model");

const DATA_PATH = path.join(__dirname, "./blogAuthor.json");

async function seed() {
  try {
    await connect();
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(rawData);
    await BlogAuthor.deleteMany({}); 
    await BlogAuthor.create(data);
    console.log("✅ Seed BlogAuthor xong!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed Author:", err);
    process.exit(1);
  }
}
seed();