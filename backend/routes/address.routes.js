const express = require("express");
const addressController = require("../app/controllers/address.controller");
const router = express.Router();
const { authJwt } = require("../middlewares/index");
router.get("/user", [authJwt.protectedRoute], addressController.getAddresses);
router.post("/", addressController.addAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
