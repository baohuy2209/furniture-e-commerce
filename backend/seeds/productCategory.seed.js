const { connect } = require("../app/config/db/index");
const ProductCategory = require("../app/models/productCategory.model");

const categories = [
  // product_type
  { name: "Sofas", slug: "sofas", type: "product_type" },
  { name: "Chairs", slug: "chairs", type: "product_type" },
  { name: "Tables", slug: "tables", type: "product_type" },
  { name: "Beds", slug: "beds", type: "product_type" },
  { name: "Storage", slug: "storage", type: "product_type" },
  { name: "Lamps", slug: "lamps", type: "product_type" },
  { name: "Rugs", slug: "rugs", type: "product_type" },
  { name: "Accessories", slug: "accessories", type: "product_type" },

  // room_type
  { name: "Living Room", slug: "living-room", type: "room_type" },
  { name: "Bedroom", slug: "bedroom", type: "room_type" },
  { name: "Dining Room", slug: "dining-room", type: "room_type" },
  { name: "Bathroom", slug: "bathroom", type: "room_type" },
  { name: "Outdoor", slug: "outdoor", type: "room_type" },
];

async function seed() {
  try {
    await connect();

    await ProductCategory.deleteMany();
    await ProductCategory.create(categories);

    console.log("✅ ProductCategory seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
