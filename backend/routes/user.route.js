const express = require("express");
const userController = require("../app/controllers/user.controller");
const router = express.Router();
const { authJwt } = require("../middlewares/index");
router.get("/", [authJwt.protectedRoute], userController.getUserInfo);
router.patch("/profile/:id", userController.updateUserProfile);
router.post("/change-password/:id", userController.changePassword);
router.delete("/:id", userController.deleteAccount);
module.exports = router;
