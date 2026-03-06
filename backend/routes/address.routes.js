const express = require("express");
const addressController = require("../app/controllers/address.controller");
const router = express.Router();

router.get("/user/:user_id", addressController.getAddresses);
router.post("/", addressController.addAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
