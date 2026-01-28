const mongoose = require("mongoose");
const { url } = require("../db.config");
async function connect() {
  try {
    await mongoose.connect(url);
    console.log("Connect successfully");
  } catch (error) {
    console.log("Error" + error);
  }
}
module.exports = { connect };
