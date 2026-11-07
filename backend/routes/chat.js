const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const requireUser = require("../middleware/requireUser");
const {stressChange} = require("../services/personalHealthCheck");

router.use(requireUser);
router.get("/check-in", async (req, res) => {
  try {
    const change = await stressChange(req.user.id);
    res.json({data: {day: change?.day ?? null}});
  } catch {
    res.status(503).json({message: "오늘의 안부를 확인하지 못했어요."});
  }
});

// 챗봇 AI 중계
router.post("/reply", chatController.reply);

router.post("/messages", chatController.createMessage);
router.get("/messages", chatController.getMessages);
router.delete("/messages/:chat_id", chatController.deleteMessage);

router.post("/summary", chatController.createSummary);
router.get("/summary", chatController.getSummaries);

module.exports = router;
