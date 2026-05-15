const express = require("express");
const router = express.Router();

const controller = require("../controllers/evaluationController");
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");

router.post("/rounds/:roundId/assign", auth, roles(["admin", "organizer"]), controller.assignSubmissions);
router.get("/assignments/me", auth, roles(["judge"]), controller.getMyAssignments);
router.put("/assignments/:assignmentId", auth, roles(["judge"]), controller.submitEvaluation);
router.post("/rounds/:roundId/finish", auth, roles(["admin", "organizer"]), controller.finishEvaluation);
router.get("/rounds/:roundId", auth, roles(["admin", "organizer"]), controller.getRoundEvaluations);

module.exports = router;
