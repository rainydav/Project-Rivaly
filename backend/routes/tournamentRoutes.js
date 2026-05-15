const express = require("express");
const router = express.Router();

const controller = require("../controllers/tournamentController");
const roundController = require("../controllers/roundController");
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");

function withTournamentIdParam(req, _res, next) {
  if (req.params.id && !req.params.tournamentId) {
    req.params.tournamentId = req.params.id;
  }
  next();
}

/** Створення та керування турнірами: адмін або організатор */
const tournamentEditorRoles = roles(["admin", "organizer"]);

router.get("/", controller.getTournaments);
router.get("/me/dashboard", auth, roles(["participant"]), controller.getTeamDashboard);
router.get("/:id/leaderboard", controller.getLeaderboard);
router.get("/:id/leaderboard.csv", controller.exportLeaderboardCsv);
router.get("/:id/rounds", withTournamentIdParam, roundController.getRounds);
router.post(
  "/:id/rounds",
  auth,
  tournamentEditorRoles,
  withTournamentIdParam,
  roundController.createRound
);
router.get("/:id", controller.getTournament);

router.post("/", auth, tournamentEditorRoles, controller.createTournament);
router.put("/:id", auth, tournamentEditorRoles, controller.updateTournament);
router.delete("/:id", auth, roles(["admin"]), controller.deleteTournament);

router.post("/:id/events", auth, tournamentEditorRoles, controller.createEvent);
router.put("/:id/events/:eventId", auth, tournamentEditorRoles, controller.updateEvent);
router.delete("/:id/events/:eventId", auth, tournamentEditorRoles, controller.deleteEvent);
router.post("/:id/announcements", auth, tournamentEditorRoles, controller.createAnnouncement);
router.put("/:id/announcements/:announcementId", auth, tournamentEditorRoles, controller.updateAnnouncement);
router.delete("/:id/announcements/:announcementId", auth, tournamentEditorRoles, controller.deleteAnnouncement);

module.exports = router;
