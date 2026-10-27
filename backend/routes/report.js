const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.post("/", reportController.createReport);
router.get("/", reportController.getReports);
router.get("/:health_report_id", reportController.getReportDetail);
router.delete("/:health_report_id", reportController.deleteReport);

module.exports = router;