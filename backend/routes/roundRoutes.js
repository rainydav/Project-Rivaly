const express = require("express");
const router = express.Router({ mergeParams: true });

const controller = require("../controllers/roundController");
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");

/** Раунди створюють адмін або організатор (як і турніри). */
const adminRoles = roles(["admin", "organizer"]);

router.get("/tournaments/:tournamentId/rounds", controller.getRounds);
router.get("/rounds/:roundId", controller.getRound);
router.post("/tournaments/:tournamentId/rounds", auth, adminRoles, controller.createRound);
router.put("/rounds/:roundId", auth, adminRoles, controller.updateRound);
router.patch("/rounds/:roundId/status", auth, adminRoles, controller.changeRoundStatus);

module.exports = router;
