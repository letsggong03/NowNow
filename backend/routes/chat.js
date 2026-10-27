const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.post("/messages", chatController.createMessage);
router.get("/messages", chatController.getMessages);
router.delete("/messages/:chat_id", chatController.deleteMessage);

router.post("/summary", chatController.createSummary);
router.get("/summary", chatController.getSummaries);

module.exports = router;