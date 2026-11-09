const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");
const requireUser = require("../middleware/requireUser");

router.use(requireUser);

// Health Connect에서 읽은 원본 기록(심박수·혈압·산소포화도·걸음 수·수면)을 한 번에 저장
router.post("/records", healthController.saveRecords);
router.get("/blood-pressure", healthController.getTodayBloodPressure);

module.exports = router;
