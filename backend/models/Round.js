const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  technologyRequirements: {
    type: String,
    default: ""
  },
  mustHaveCriteria: {
    type: [String],
    default: []
  },
  materials: [{
    title: { type: String, default: "" },
    url: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ["DRAFT", "ACTIVE", "SUBMISSION_CLOSED", "EVALUATED"],
    default: "DRAFT",
    index: true
  },
  startsAt: {
    type: Date,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  evaluationDeadline: {
    type: Date
  },
  minEvaluationsPerSubmission: {
    type: Number,
    min: 1,
    default: 2
  },
  evaluationsPerJuror: {
    type: Number,
    min: 1,
    default: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

roundSchema.index({ tournament: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("Round", roundSchema);
