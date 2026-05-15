const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const QuizAttemptLog = require("../models/QuizAttemptLog");

/**
 * PATCH /api/attempts/answer
 * Миттєве збереження відповіді під час тесту (фронтенд викликає після кожного вибору).
 */
router.patch("/answer", auth, async (req, res) => {
  try {
    const { attemptId, questionId, answer, violationDelta } = req.body;

    if (!attemptId || !questionId) {
      return res.status(400).json({ message: "attemptId and questionId are required" });
    }

    await QuizAttemptLog.create({
      userId: req.user.id,
      attemptId: String(attemptId),
      questionId: String(questionId),
      answer: answer === undefined ? null : answer,
      violationDelta: Number(violationDelta) || 0,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/attempts/live-stats — змагальна вікторина (лог подій).
 */
router.post("/live-stats", auth, async (req, res) => {
  try {
    await QuizAttemptLog.create({
      userId: req.user.id,
      attemptId: `live-${Date.now()}`,
      questionId: "live-event",
      answer: req.body,
      violationDelta: 0,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
