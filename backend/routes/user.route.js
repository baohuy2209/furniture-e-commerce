const express = require("express");
const userController = require("../app/controllers/user.controller");
const router = express.Router();
const { authJwt } = require("../middlewares/index");
router.get("/", [authJwt.protectedRoute], userController.getUserInfo);
router.get("/admin", userController.getAllInfoUser);
router.post("/admin/:id", userController.changeStatusAccount)
router.post("/create-user", userController.createUserGuest);
router.patch(
  "/profile",
  [authJwt.protectedRoute],
  userController.updateUserProfile,
);
router.post(
  "/change-password",
  [authJwt.protectedRoute],
  userController.changePassword,
);
router.delete("/", [authJwt.protectedRoute], userController.deleteAccount);

module.exports = router;
