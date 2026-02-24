const fs = require("fs");
const path = require("path");

const { connect } = require("../app/config/db/index");
const ProductVariantImage = require("../app/models/productVariantImage.model");

const DATA_PATH = path.join(__dirname, "./productVariantImage.json");
const productVariantImages = [
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/main/image.png",
    is_main: true,
    position: 0,
  },
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/image1.png",
    is_main: false,
    position: 1,
  },
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/image2.png",
    is_main: false,
    position: 2,
  },
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/image3.png",
    is_main: false,
    position: 3,
  },
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/image4.png",
    is_main: false,
    position: 4,
  },
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/image5.png",
    is_main: false,
    position: 5,
  },
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/image6.png",
    is_main: true,
    position: 6,
  },
  {
    product_variant: "699dcbec0611fedb90d43351",
    url: "images/products/living_room/mango_leaf_sculpture/image7.png",
    is_main: true,
    position: 7,
  },
  {
    product_variant: "699dccea02c4dc45263a0a92",
    url: "images/products/living_room/medina_mirror/main/image.png",
    is_main: true,
    position: 0,
  },
  {
    product_variant: "699dccea02c4dc45263a0a92",
    url: "images/products/living_room/medina_mirror/image1.png",
    is_main: false,
    position: 1,
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
    // await ProductVariantImage.deleteMany({});
    // console.log("🧹 Old product variant images removed");

    // 4️⃣ Create nhiều product
    const docs = await ProductVariantImage.create(productVariantImages);

    console.log(`✅ Seeded ${docs.length} product variants`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed product failed");
    console.error(err);
    process.exit(1);
  }
}

seed();
