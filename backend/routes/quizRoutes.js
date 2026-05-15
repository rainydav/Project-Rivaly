const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");
const quizController = require("../controllers/quizController");

const editor = roles(["admin", "organizer"]);

router.get("/", auth, quizController.listQuizzes);
router.post("/", auth, editor, quizController.createQuiz);
router.post("/:id/grade", auth, quizController.gradeAnswer);
router.post("/:id/finish", auth, quizController.finishQuiz);
router.put("/:id", auth, editor, quizController.updateQuiz);
router.delete("/:id", auth, roles(["admin"]), quizController.deleteQuiz);
router.get("/:id", auth, quizController.getQuiz);

module.exports = router;
