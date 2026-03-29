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
router.post("/google", authController.googleAuthentication);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/check-otp", authController.checkOtpResetPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);
router.post("/refresh-token", authController.refreshUserToken);
module.exports = router;
