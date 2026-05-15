const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
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
  body: {
    type: String,
    required: true
  },
  notify: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Announcement", announcementSchema);
