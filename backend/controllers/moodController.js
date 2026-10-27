const moodService = require("../services/moodService");
const { isDate } = require("../utils/kstDate");

const MAX_MOOD_LENGTH = 30;

async function getMood(req, res) {
  try {
    const { date } = req.params;

    if (!isDate(date)) {
      return res.status(400).json({
        message: "date는 YYYY-MM-DD 형식이어야 합니다."
      });
    }

    const data = await moodService.getMood(req.user.id, date);

    res.json({
      message: "기분 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "기분 조회 실패",
      error: error.message
    });
  }
}

async function setMood(req, res) {
  try {
    const { date } = req.params;
    const mood = typeof req.body?.mood === "string" ? req.body.mood.trim() : "";

    if (!isDate(date)) {
      return res.status(400).json({
        message: "date는 YYYY-MM-DD 형식이어야 합니다."
      });
    }

    if (!mood || mood.length > MAX_MOOD_LENGTH) {
      return res.status(400).json({
        message: `mood는 1~${MAX_MOOD_LENGTH}자 문자열이어야 합니다.`
      });
    }

    const data = await moodService.setMood(req.user.id, date, mood);

    res.json({
      message: "기분 저장 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "기분 저장 실패",
      error: error.message
    });
  }
}

module.exports = {
  getMood,
  setMood
};
