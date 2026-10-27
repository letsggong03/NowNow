const express = require("express");
const router = express.Router();
const characterController = require("../controllers/characterController");
const requireUser = require("../middleware/requireUser");

router.use(requireUser);

router.post("/interactions", characterController.createInteraction);
router.get("/interactions", characterController.getInteractions);

module.exports = router;
