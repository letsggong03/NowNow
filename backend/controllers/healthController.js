const healthService = require("../services/healthService");
const { parseHealthRecords } = require("../utils/healthRecords");

async function getTodayBloodPressure(req, res) {
  try {
    const data = await healthService.getTodayBloodPressure(req.user.id);
    res.json({ data });
  } catch {
    res.status(500).json({ message: "혈압 기록을 불러오지 못했습니다." });
  }
}

async function saveRecords(req, res) {
  try {
    const { records, error: validationError } = parseHealthRecords(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { saved, failed } = await healthService.saveRecords(req.user.id, records);

    if (Object.keys(failed).length > 0) {
      return res.status(500).json({
        message: "건강 기록 일부 저장 실패",
        data: { saved },
        error: failed
      });
    }

    res.status(201).json({
      message: "건강 기록 저장 성공",
      data: { saved }
    });
  } catch (error) {
    res.status(500).json({
      message: "건강 기록 저장 실패",
      error: error.message
    });
  }
}

module.exports = {
  getTodayBloodPressure,
  saveRecords
};
