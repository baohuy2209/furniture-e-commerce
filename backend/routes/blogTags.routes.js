const express = require("express");
const router = express.Router();
const blogTagsController = require("../app/controllers/blogTags.controller");
router.get("/", blogTagsController.getAllBlogTags);
router.get("/:id", blogTagsController.getDetailBlogTags);
router.post("/", blogTagsController.createNewBlogTags);
router.patch("/:id", blogTagsController.updateBlogTags);
router.delete("/:id", blogTagsController.deleteBlogTags);
module.exports = router;
