const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const requireUser = require("../middleware/requireUser");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/me", requireUser, authController.getMyInfo);
router.patch("/me", requireUser, authController.updateMyInfo);

module.exports = router;
