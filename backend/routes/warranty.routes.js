const express = require("express");
const warrantyController = require("../app/controllers/warranty.controller");
const router = express.Router();

router.post("/", warrantyController.createWarrantyRequest);
router.get("/user/:user_id", warrantyController.getUserWarranties);

module.exports = router;