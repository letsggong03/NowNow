const express = require("express");
const router = express.Router();
const stressController = require("../controllers/stressController");
router.use(require('../middleware/requireUser'), require('../middleware/ownUser'));

router.get("/realtime", stressController.getRealtimeStress);
router.get("/daily", stressController.getDailyStress);

module.exports = router;
