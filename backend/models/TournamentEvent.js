const mongoose = require("mongoose");

const tournamentEventSchema = new mongoose.Schema({
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
    default: ""
  },
  startsAt: {
    type: Date,
    required: true
  },
  endsAt: {
    type: Date
  },
  url: {
    type: String,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("TournamentEvent", tournamentEventSchema);
