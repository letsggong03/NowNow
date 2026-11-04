const express = require("express");
const router = express.Router();
const stressController = require("../controllers/stressController");
const requireUser = require("../middleware/requireUser");

router.use(requireUser);

router.get("/realtime", stressController.getRealtimeStress);
router.get("/daily", stressController.getDailyStress);

module.exports = router;
