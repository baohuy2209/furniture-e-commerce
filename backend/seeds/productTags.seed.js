const fs = require("fs");
const path = require("path");

const { connect } = require("../app/config/db/index");
const ProductTag = require("../app/models/productTags.model");

const DATA_PATH = path.join(__dirname, "./productTags.json");

async function seed() {
  try {
    // 1️⃣ Kết nối DB
    await connect();

    // 2️⃣ Đọc file JSON
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const products = JSON.parse(rawData);

    if (!Array.isArray(products)) {
      throw new Error("❌ products.json must be an array");
    }

    // // 3️⃣ Xóa dữ liệu cũ (tuỳ chọn)
    // await Product.deleteMany({});
    // console.log("🧹 Old products removed");

    // 4️⃣ Create nhiều product
    const docs = await ProductTag.create(products);

    console.log(`✅ Seeded ${docs.length} products`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed product failed");
    console.error(err);
    process.exit(1);
  }
}

seed();
