const router = require("express").Router();
const registerEventController = require("../app/controllers/registerEvent.controller");
const { authJwt } = require("../middlewares");
router.get("/", registerEventController.getAllRegister);
router.post(
  "/",
  [authJwt.protectedRoute],
  registerEventController.registerEvents,
);
router.get("/:id", registerEventController.getDetailRegisterEventInfo);
module.exports = router;
