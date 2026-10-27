const stressService = require("../services/stressService");
const { kstDayRange } = require("../services/stressCalculator");

const isDate = value => typeof value === "string" && kstDayRange(value) !== null;

async function getRealtimeStress(req, res) {
  try {
    const { user_id, date } = req.query;

    if (!user_id || !isDate(date)) {
      return res.status(400).json({
        message: "user_id와 date(YYYY-MM-DD)가 필요합니다."
      });
    }

    const data = await stressService.getRealtimeStress(user_id, date);

    res.json({
      message: "실시간 스트레스 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "실시간 스트레스 조회 실패",
      error: error.message
    });
  }
}

async function getDailyStress(req, res) {
  try {
    const { user_id, date, sleep_minutes } = req.query;

    if (!user_id || !isDate(date)) {
      return res.status(400).json({
        message: "user_id와 date(YYYY-MM-DD)가 필요합니다."
      });
    }

    let sleepMinutes = null;

    if (sleep_minutes !== undefined) {
      sleepMinutes = Number(sleep_minutes);

      if (!Number.isFinite(sleepMinutes) || sleepMinutes < 0 || sleepMinutes > 1440) {
        return res.status(400).json({
          message: "sleep_minutes는 0~1440 사이 숫자여야 합니다."
        });
      }
    }

    const data = await stressService.getDailyStress(user_id, date, sleepMinutes);

    res.json({
      message: "일일 스트레스 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "일일 스트레스 조회 실패",
      error: error.message
    });
  }
}

module.exports = {
  getRealtimeStress,
  getDailyStress
};
