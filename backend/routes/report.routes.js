const express = require("express");
const router = express.Router();
const reportController = require("../app/controllers/report.controller");

router.get("/summary", reportController.getSummary);

module.exports = router;
