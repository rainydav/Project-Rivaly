const express = require("express");
const router = express.Router();

const controller = require("../controllers/submissionController");
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");

router.get("/", auth, roles(["admin", "judge", "organizer"]), controller.getSubmissions);
router.get("/rounds/:roundId/me", auth, controller.getMySubmission);
router.put("/rounds/:roundId", auth, controller.upsertSubmission);
router.post("/rounds/:roundId/close", auth, roles(["admin", "organizer"]), controller.closeSubmissions);

module.exports = router;
