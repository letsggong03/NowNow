const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/me", require('../middleware/requireUser'), require('../middleware/ownUser'), authController.getMyInfo);
router.patch("/me/:user_id", require('../middleware/requireUser'), require('../middleware/ownUser'), authController.updateMyInfo);

module.exports = router;
