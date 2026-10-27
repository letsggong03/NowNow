const express = require("express");
const router = express.Router();
const moodController = require("../controllers/moodController");
const requireUser = require("../middleware/requireUser");

router.use(requireUser);

router.get("/:date", moodController.getMood);
router.put("/:date", moodController.setMood);

module.exports = router;
