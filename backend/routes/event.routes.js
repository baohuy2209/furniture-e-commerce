const express = require("express");
const router = express.Router();
const eventController = require("../app/controllers/event.controller");
router.get("/", eventController.getAllEvents);
router.post("/", eventController.createEvent);
router.get("/:id", eventController.getDetailEvent);
router.patch("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);
module.exports = router;
