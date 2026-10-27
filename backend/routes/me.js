const express = require("express");
const router = express.Router();
const meController = require("../controllers/meController");
const requireUser = require("../middleware/requireUser");

router.use(requireUser);

router.get("/settings", meController.getSettings);
router.put("/settings", meController.updateSettings);
router.post("/push-tokens", meController.savePushToken);
router.delete("/push-tokens/:token", meController.deletePushToken);
router.delete("/", meController.deleteAccount);

module.exports = router;
