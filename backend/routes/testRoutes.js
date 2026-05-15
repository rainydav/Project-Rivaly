const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");
const testController = require("../controllers/testController");

const editor = roles(["admin", "organizer"]);

router.get("/", auth, testController.listTests);
router.post("/", auth, editor, testController.createTest);
router.post("/:id/submit", auth, testController.submitTest);
router.get("/:id/full", auth, editor, testController.getTestAdmin);
router.put("/:id", auth, editor, testController.updateTest);
router.delete("/:id", auth, roles(["admin"]), testController.deleteTest);
router.get("/:id", auth, testController.getTest);

module.exports = router;
