const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  requirements: {
    type: String,
    default: ""
  },
  rules: {
    type: String,
    default: ""
  },
  startDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ["DRAFT", "REGISTRATION", "RUNNING", "FINISHED"],
    default: "DRAFT",
    index: true
  },
  registrationStart: {
    type: Date,
    required: true
  },
  registrationEnd: {
    type: Date,
    required: true
  },
  maxTeams: {
    type: Number,
    min: 1
  },
  format: {
    type: String,
    enum: ["SINGLE_ROUND", "MULTI_ROUND"],
    default: "SINGLE_ROUND"
  },
  minTeamMembers: {
    type: Number,
    min: 1,
    default: 2
  },
  maxTeamMembers: {
    type: Number,
    min: 2,
    default: 5
  },
  showTeamsBeforeRegistrationEnd: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  /**
   * Критерії оцінювання робіт (налаштовує адміністратор).
   * key — технічний ключ у об'єкті scores; label — підпис у UI.
   */
  evaluationCriteria: {
    type: [{
      key: { type: String, required: true, trim: true },
      label: { type: String, required: true, trim: true }
    }],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Tournament", tournamentSchema);
