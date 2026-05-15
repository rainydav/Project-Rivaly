const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, default: 0 },
    points: { type: Number, default: 10 },
    timeLimitSec: { type: Number, default: 15, min: 3 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    competitive: { type: Boolean, default: true },
    questions: { type: [quizQuestionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
