const reportService = require("../services/reportService");

async function createReport(req, res) {
  try {
    const { heart_rate, measured_at } = req.body;

    if (!heart_rate || !measured_at) {
      return res.status(400).json({
        message: "heart_rate, measured_at이 필요합니다."
      });
    }

    const data = await reportService.createReport({
      ...req.body,
      user_id: req.user.id
    });

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
    const data = await reportService.getReportsByUser(req.user.id);

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

    const data = await reportService.getReportById(health_record_id, req.user.id);

    if (!data) {
      return res.status(404).json({ message: "리포트를 찾을 수 없습니다." });
    }

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

    await reportService.deleteReport(health_record_id, req.user.id);

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