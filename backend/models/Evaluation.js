const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true
  },
  round: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Round",
    required: true,
    index: true
  },
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission",
    required: true,
    index: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    index: true
  },
  jury: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  scores: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  totalScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  comment: {
    type: String,
    default: ""
  }
}, { timestamps: true });

evaluationSchema.index({ submission: 1, jury: 1 }, { unique: true });

module.exports = mongoose.model("Evaluation", evaluationSchema);
