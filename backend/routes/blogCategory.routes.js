const express = require("express");
const router = express.Router();
const blogCategoriesController = require("../app/controllers/blogCategories.controller");
router.get("/", blogCategoriesController.getAllBlogCategories);
router.get("/:id", blogCategoriesController.getDetailBlogCategory);
router.post("/", blogCategoriesController.createNewBlogCategories);
router.patch("/:id", blogCategoriesController.updateBlogCategory);
router.delete("/:id", blogCategoriesController.deleteBlogCategory);
module.exports = router;
