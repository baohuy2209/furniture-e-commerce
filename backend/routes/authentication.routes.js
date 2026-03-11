const express = require("express");
const { verifySignUp } = require("../middlewares");
const authController = require("../app/controllers/auth.controller");
const router = express.Router();
router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
  next();
});

router.post(
  "/signup",
  [verifySignUp.checkDuplicatedEmail, verifySignUp.checkRolesExisted],
  authController.signup,
);
router.post("/signin", authController.signin);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
// router.post("/change-password", authController.changePassword);
module.exports = router;
