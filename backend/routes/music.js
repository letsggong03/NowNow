const express = require("express");
const router = express.Router();
const musicController = require("../controllers/musicController");
const requireUser = require("../middleware/requireUser");

router.use(requireUser);

// 홈 "음악 듣기"에서 고른 취향에 어울리는 오늘의 곡 (유튜브)
router.get("/recommendation", musicController.getRecommendation);

module.exports = router;
