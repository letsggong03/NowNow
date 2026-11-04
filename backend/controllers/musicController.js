const musicService = require("../services/musicService");
const { parseMusicChoice } = require("../utils/musicSearch");

async function getRecommendation(req, res) {
  try {
    const { choice, query, error } = parseMusicChoice(req.query.choice);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const track = await musicService.getDailyTrack(choice, query);

    if (!track) {
      return res.status(404).json({ message: "어울리는 곡을 찾지 못했어요." });
    }

    res.json({
      message: "음악 추천 성공",
      data: track
    });
  } catch (error) {
    res.status(error.status ?? 500).json({
      message: error.status ? error.message : "음악 추천 실패"
    });
  }
}

module.exports = {
  getRecommendation
};
