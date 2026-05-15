const mongoose = require("mongoose");

const evaluationAssignmentSchema = new mongoose.Schema({
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
  jury: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["ASSIGNED", "EVALUATED"],
    default: "ASSIGNED"
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

evaluationAssignmentSchema.index({ submission: 1, jury: 1 }, { unique: true });

module.exports = mongoose.model("EvaluationAssignment", evaluationAssignmentSchema);
