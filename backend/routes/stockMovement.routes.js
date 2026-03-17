const express = require("express");
const router = express.Router();
const stockMovementController = require("../app/controllers/stockMovement.controller");

router.get("/", stockMovementController.getAllMovements);
router.post("/", stockMovementController.createMovement);

module.exports = router;
