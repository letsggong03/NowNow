const insightService = require("../services/insightService");
const { isDate, kstToday, weekStartOf } = require("../utils/kstDate");

async function getStressCauses(req, res) {
  try {
    const period = req.query.period ?? "week";

    if (!["week", "month"].includes(period)) {
      return res.status(400).json({
        message: "period는 week 또는 month여야 합니다."
      });
    }

    const data = await insightService.getStressCauses(req.user.id, period);

    res.json({
      message: "스트레스 원인 통계 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "스트레스 원인 통계 조회 실패",
      error: error.message
    });
  }
}

async function getRecommendation(req, res) {
  try {
    const date = req.query.date ?? kstToday();

    if (!isDate(date)) {
      return res.status(400).json({
        message: "date는 YYYY-MM-DD 형식이어야 합니다."
      });
    }

    const data = await insightService.getRecommendation(req.user.id, date);

    res.json({
      message: "추천 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "추천 조회 실패",
      error: error.message
    });
  }
}

async function getWeeklyReports(req, res) {
  try {
    const limit = req.query.limit === undefined ? 4 : Number(req.query.limit);

    if (!Number.isInteger(limit) || limit < 1 || limit > 8) {
      return res.status(400).json({
        message: "limit은 1~8 사이 정수여야 합니다."
      });
    }

    const data = await insightService.getWeeklyReports(req.user.id, limit);

    res.json({
      message: "주간 리포트 목록 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "주간 리포트 목록 조회 실패",
      error: error.message
    });
  }
}

async function getWeeklyReport(req, res) {
  try {
    const { weekStart } = req.params;

    if (!isDate(weekStart) || weekStartOf(weekStart) !== weekStart) {
      return res.status(400).json({
        message: "weekStart는 월요일 날짜(YYYY-MM-DD)여야 합니다."
      });
    }

    if (weekStart > kstToday()) {
      return res.status(400).json({
        message: "아직 시작하지 않은 주입니다."
      });
    }

    const data = await insightService.getWeeklyReport(req.user.id, weekStart);

    res.json({
      message: "주간 리포트 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "주간 리포트 조회 실패",
      error: error.message
    });
  }
}

module.exports = {
  getStressCauses,
  getRecommendation,
  getWeeklyReports,
  getWeeklyReport
};
