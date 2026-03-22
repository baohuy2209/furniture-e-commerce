const express = require("express");
const router = express.Router();
const blogAuthorController = require("../app/controllers/blogAuthor.controller");
router.get("/:id", blogAuthorController.getDetailAuthor);
router.get("/", blogAuthorController.getAllBlogAuthor);
module.exports = router;
