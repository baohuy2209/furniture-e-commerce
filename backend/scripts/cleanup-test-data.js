/**
 * Cleanup script to clear test/mockup data from the database.
 * Run: node scripts/cleanup-test-data.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const DB_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/furniture-e-commerce";

async function cleanup() {
  await mongoose.connect(DB_URL);
  console.log("Connected to MongoDB:", DB_URL);

  const collections = [
    "products",
    "productvariants",
    "productvariantimages",
    "brands",
    "warehouses",
    "purchaseorders",
    "purchaseorderitems",
    "stockitems",
    "stockmovements",
    "producttags"
  ];

  for (const colName of collections) {
    try {
      const result = await mongoose.connection.db.collection(colName).deleteMany({});
      console.log(`🗑️  Cleared ${colName}: deleted ${result.deletedCount} documents.`);
    } catch (e) {
      console.error(`❌ Error clearing ${colName}:`, e.message);
    }
  }

  console.log("\n🎉 Database cleanup complete! You can now start fresh.");
  await mongoose.disconnect();
}

cleanup().catch((e) => {
  console.error(e);
  process.exit(1);
});
