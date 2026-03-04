const express = require("express");
const router = express.Router();
const eventController = require("../app/controllers/event.controller");
router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getDetailEvent);
router.post("/", eventController.createNewEvent);
router.patch("/:id", eventController.updateInfoEvent);
router.delete("/:id", eventController.deleteEvent);
module.exports = router;
