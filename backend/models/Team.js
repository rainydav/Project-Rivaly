const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  captain: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }
  },
  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      fullName: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      }
    }
  ],
  organization: {
    type: String,
    default: ""
  },
  contact: {
    type: String,
    default: ""
  },
  availability: {
    type: [String],
    default: []
  }
}, { timestamps: true });

teamSchema.index({ tournament: 1, name: 1 }, { unique: true });
teamSchema.index({ tournament: 1, "captain.email": 1 }, { unique: true });

module.exports = mongoose.model("Team", teamSchema);
