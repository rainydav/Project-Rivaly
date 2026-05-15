const express = require("express");
const router = express.Router();

const controller = require("../controllers/teamController");
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");

router.get("/", auth, roles(["admin"]), controller.getTeams);
router.post("/", auth, roles(["participant"]), controller.createTeam);
router.post("/:id/members", auth, roles(["participant"]), controller.addMember);
router.post("/:id/remove-member", auth, roles(["participant"]), controller.removeMember);
router.put("/:id", auth, roles(["participant", "admin"]), controller.updateTeam);
router.delete("/:id", auth, roles(["participant", "admin"]), controller.deleteTeam);

module.exports = router;
