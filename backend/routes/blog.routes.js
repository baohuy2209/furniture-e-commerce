const express = require("express");
const router = express.Router();
const blogController = require("../app/controllers/blogPosts.controller");
router.get("/", blogController.getAll);
router.get("/:id", blogController.getById);
module.exports = router;