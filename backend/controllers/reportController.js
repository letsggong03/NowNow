const reportService = require("../services/reportService");

async function createReport(req, res) {
  try {
    const { user_id, heart_rate, measured_at } = req.body;

    if (!user_id || !heart_rate || !measured_at) {
      return res.status(400).json({
        message: "user_id, heart_rate, measured_at이 필요합니다."
      });
    }

    const data = await reportService.createReport(req.body);

    res.status(201).json({
      message: "리포트 생성 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "리포트 생성 실패",
      error: error.message
    });
  }
}

async function getReports(req, res) {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id가 필요합니다."
      });
    }

    const data = await reportService.getReportsByUser(user_id);

    res.json({
      message: "리포트 목록 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "리포트 목록 조회 실패",
      error: error.message
    });
  }
}

async function getReportDetail(req, res) {
  try {
    const { health_record_id } = req.params;

    const data = await reportService.getReportById(health_record_id);

    res.json({
      message: "리포트 상세 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "리포트 상세 조회 실패",
      error: error.message
    });
  }
}

async function deleteReport(req, res) {
  try {
    const { health_record_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id가 필요합니다."
      });
    }

    await reportService.deleteReport(health_record_id, user_id);

    res.json({
      message: "리포트 삭제 성공"
    });
  } catch (error) {
    res.status(500).json({
      message: "리포트 삭제 실패",
      error: error.message
    });
  }
}

module.exports = {
  createReport,
  getReports,
  getReportDetail,
  deleteReport
};