const express = require("express");
const router = express.Router();
const stressController = require("../controllers/stressController");

router.get("/realtime", stressController.getRealtimeStress);
router.get("/daily", stressController.getDailyStress);

module.exports = router;
