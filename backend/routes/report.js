const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const insightController = require("../controllers/insightController");
const requireUser = require("../middleware/requireUser");

router.use(requireUser);

// 리포트 화면 집계. "/:health_record_id"보다 먼저 등록해야 경로가 id로 잡히지 않는다.
router.get("/stress-causes", insightController.getStressCauses);
router.get("/recommendation", insightController.getRecommendation);
router.post("/ai-recommendation", insightController.createAiRecommendation);
router.get("/weekly", insightController.getWeeklyReports);
router.get("/weekly/:weekStart", insightController.getWeeklyReport);

router.post("/", reportController.createReport);
router.get("/", reportController.getReports);
router.get("/:health_record_id", reportController.getReportDetail);
router.delete("/:health_record_id", reportController.deleteReport);

module.exports = router;
