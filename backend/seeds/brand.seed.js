const fs = require("fs");
const path = require("path");

const { connect } = require("../app/config/db/index");
const Brand = require("../app/models/brand.model");

const DATA_PATH = path.join(__dirname, "./brand.json");

async function seed() {
  try {
    // 1️⃣ Kết nối DB
    await connect();

    // 2️⃣ Đọc file JSON
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const brands = JSON.parse(rawData);

    if (!Array.isArray(brands)) {
      throw new Error("❌ brand.json must be an array");
    }

    // 3️⃣ Xóa dữ liệu cũ (tuỳ chọn)
    await Brand.deleteMany({});
    console.log("🧹 Old brands removed");

    // 4️⃣ Create nhiều brand
    const docs = await Brand.create(brands);

    console.log(`✅ Seeded ${docs.length} brands`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed brand failed");
    console.error(err);
    process.exit(1);
  }
}

seed();
