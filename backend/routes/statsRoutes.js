const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const statsController = require("../controllers/statsController");

router.get("/dashboard", auth, statsController.getDashboardStats);
router.get("/leaderboard", auth, statsController.getLeaderboard);

module.exports = router;
