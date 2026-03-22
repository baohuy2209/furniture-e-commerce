const express = require("express");
const router = express.Router();
const blogCategoriesController = require("../app/controllers/blogCategories.controller");
const { authJwt } = require("../middlewares");
router.get("/", blogCategoriesController.getAllBlogCategories);
router.get("/:id", blogCategoriesController.getDetailBlogCategory);
router.post(
  "/",
  [authJwt.protectedRoute],
  blogCategoriesController.createNewBlogCategories,
);
router.patch(
  "/:id",
  [authJwt.protectedRoute],
  blogCategoriesController.updateBlogCategory,
);
router.delete(
  "/:id",
  [authJwt.protectedRoute],
  blogCategoriesController.deleteBlogCategory,
);
module.exports = router;
