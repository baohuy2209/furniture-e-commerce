const fs = require("fs");
const path = require("path");

const { connect } = require("../app/config/db/index");
const Product = require("../app/models/product.model");

const DATA_PATH = path.join(__dirname, "./product.json");
// const product_add = [
//   {
//     product_name:
//       "Hammpton corner sofa with adjustable back and storage on right side",
//     brand: "Hammpton",
//     description:
//       "Sofa góc Hammpton với phần tựa lưng có thể điều chỉnh linh hoạt và ngăn chứa đồ tích hợp ở tay vịn bên phải, phù hợp cho không gian phòng khách hiện đại.",
//     discount_percent: 10,
//     is_assembly: false,
//     warranty: 12,

//     tags: [
//       "699d531503c4b1aef1ea71e2",
//       "699d531503c4b1aef1ea71e4",
//       "699d531503c4b1aef1ea71fa",
//     ],

//     important_functions: [
//       "Tựa lưng điều chỉnh cho nhiều tư thế ngồi",
//       "Ngăn chứa đồ tích hợp ở tay vịn bên phải",
//     ],

//     product_component: {
//       sofa_direction: ["left", "right"],
//       upholstery: [
//         "Belge Arezzo Fabric 3331",
//         "Belge Lucca Fabric 3320",
//         "Camel Lucca Fabric 3324",
//         "Green Arezzo Fabric 3334",
//         "Light Brown Arezzo Fabric 3332",
//         "Ochre Arezzo Fabric 3333",
//         "Red Lucca Fabric 3323",
//         "Stone Grey Napoli Fabric 2255",
//         "White Lucca Fabric 3321",
//         "White Rimini Fabric 3083",
//       ],
//     },

//     categories: ["699d49ee6d5cf60b02c67cf0", "699d49ee6d5cf60b02c67cf8"],
//   },
// ];
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

    // 3️⃣ Xóa dữ liệu cũ (tuỳ chọn)
    await Product.deleteMany({});
    console.log("🧹 Old products removed");

    // 4️⃣ Create nhiều product
    const docs = await Product.create(products);

    console.log(`✅ Seeded ${docs.length} products`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed product failed");
    console.error(err);
    process.exit(1);
  }
}

seed();
