const express = require("express");
const router = express.Router();
const eventController = require("../app/controllers/event.controller");
const { upload } = require("../middlewares/multer");

router.get("/", eventController.getAllEvents);
router.get("/past-event", eventController.getPastEvents);
router.get("/upcoming-event", eventController.getUpcommingEvent);
router.get("/current-event", eventController.getCurrentEvent);

router.post("/", upload.array("images", 5), eventController.createEvent);
router.get("/:id", eventController.getDetailEvent);
router.patch("/:id", upload.array("images", 5), eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);

module.exports = router;
