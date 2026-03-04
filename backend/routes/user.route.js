const express = require("express");
const userController = require("../app/controllers/user.controller");
const router = express.Router();
router.get("/:id", userController.getUserInfo);
router.patch("/profile/:id", userController.updateUserProfile);
router.post("/change-password/:id", userController.changePassword);
router.delete("/:id", userController.deleteAccount);
module.exports = router;
