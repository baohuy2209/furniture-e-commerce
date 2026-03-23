/**
 * Basic re-seed script to add 1 warehouse and 1 brand.
 * Run after cleanup: node scripts/reseed-basic-data.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Warehouse = require("../app/models/warehouse.model");
const Brand = require("../app/models/brand.model");

const DB_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/furniture-e-commerce";

async function reseed() {
  await mongoose.connect(DB_URL);
  console.log("Connected to MongoDB:", DB_URL);

  // 1. Warehouse
  const wh = {
    name: "Kho Tổng TP.HCM",
    address_warehouse: "123 Đường ABC, Quận 1, TP.HCM",
    warehouse_area: "500m2",
    warehouse_status: "active"
  };
  const whExists = await Warehouse.findOne({ name: wh.name });
  if (!whExists) {
    await new Warehouse(wh).save();
    console.log("✅ Created Warehouse: " + wh.name);
  }

  // 2. Brand
  const br = {
    name: "HomeBase Signature",
    address: "789 Đường XYZ, Hà Nội",
    phone: "0123456789",
    contact_email: "signature@homebase.com",
    slug: "homebase-signature-" + Date.now()
  };
  const brExists = await Brand.findOne({ name: br.name });
  if (!brExists) {
    await new Brand(br).save();
    console.log("✅ Created Brand: " + br.name);
  }

  console.log("\n🎉 Basic re-seed complete!");
  await mongoose.disconnect();
}

reseed().catch(e => { console.error(e); process.exit(1); });
