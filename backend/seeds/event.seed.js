const fs = require("fs");
const path = require("path");

const { connect } = require("../app/config/db/index");
const Event = require("../app/models/event.model");

const DATA_PATH = path.join(__dirname, "./event.json");

async function seed() {
  try {
    // 1️⃣ Kết nối DB
    await connect();

    // 2️⃣ Đọc file JSON
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    const events = JSON.parse(rawData);

    if (!Array.isArray(events)) {
      throw new Error("❌ event.json must be an array");
    }

    // 3️⃣ Xóa dữ liệu cũ (tuỳ chọn)
    await Event.deleteMany({});
    console.log("🧹 Old events removed");

    // 4️⃣ Create nhiều event
    const docs = await Event.create(events);

    console.log(`✅ Seeded ${docs.length} events`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed event failed");
    console.error(err);
    process.exit(1);
  }
}

seed();
