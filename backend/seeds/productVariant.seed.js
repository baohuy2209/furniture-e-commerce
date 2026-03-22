const fs = require("fs");
const path = require("path");

const { connect } = require("../app/config/db/index");
const ProductVariant = require("../app/models/productVariant.model");

const DATA_PATH = path.join(__dirname, "./productVariant.json");
const productVariant = [
  {
    product: "699d977cc400dbca31d7dba2",
    sku: "107019014836",
    price: 26500000,
    weight: 40,
    num_inventory: 5100,
    num_selled: 110,
    designed_by: "Morten Georgsen",
    rating: {
      average: 5,
      count: 100,
    },
    expected_delivery: "8-12 ngày",
    is_default: true,
    measurement: {
      depth: 40,
      diameter: 80,
    },
  },
];
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
    // await ProductVariant.deleteMany({});
    // console.log("🧹 Old products removed");

    // 4️⃣ Create nhiều product
    const docs = await ProductVariant.create(productVariant);

    console.log(`✅ Seeded ${docs.length} product variants`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed product failed");
    console.error(err);
    process.exit(1);
  }
}

seed();
