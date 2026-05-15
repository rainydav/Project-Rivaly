const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
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
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    index: true
  },
  githubUrl: {
    type: String,
    required: true,
    trim: true
  },
  demoUrl: {
    type: String,
    required: true,
    trim: true
  },
  liveDemoUrl: {
    type: String,
    trim: true,
    default: ""
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  lockedAt: {
    type: Date
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

submissionSchema.index({ round: 1, team: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
