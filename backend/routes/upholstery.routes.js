const express = require("express");
const router = express.Router();
const upholsteryController = require("../app/controllers/upholstery.controller");
router.get("/", upholsteryController.getAllUpholstery);
router.get("/:id", upholsteryController.getDetailUpholstery);
router.post("/", upholsteryController.createNewUpholstery);
router.patch("/:id", upholsteryController.updateUpholstery);
router.delete("/:id", upholsteryController.deleteUpholstery);
module.exports = router;
