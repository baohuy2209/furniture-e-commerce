const mongoose = require("mongoose");
const Role = require("../../models/role.model");
async function connect() {
  try {
    await mongoose
      .connect("mongodb://localhost:27017/furniture-e-commerce")
      .then(() => {
        console.log("Connect successfully");
        initial();
      })
      .catch((err) => {
        console.error("Connection error", err);
        process.exit();
      });
  } catch (error) {
    console.log("Error" + error);
  }
}
async function initial() {
  try {
    const count = await Role.estimatedDocumentCount();
    if (count === 0) {
      await new Role({
        name: "user",
      }).save();
      await new Role({
        name: "moderator",
      }).save();

      await new Role({
        name: "admin",
      }).save();
    }
  } catch (err) {
    console.log(err);
  }
}
module.exports = { connect };
