const mongoose = require("mongoose");

/**
 * Лог відповідей на тести / вікторини з фронтенду (анти-чит PATCH).
 * Можна розширити схемою під повноцінний Quiz Engine.
 */
const QuizAttemptLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    attemptId: { type: String, required: true },
    questionId: { type: String, required: true },
    /** null = пропущено / порушення */
    answer: { type: mongoose.Schema.Types.Mixed, default: null },
    violationDelta: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttemptLog", QuizAttemptLogSchema);
