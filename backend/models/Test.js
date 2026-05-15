const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, default: 0 },
    points: { type: Number, default: 5 },
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    timerMinutes: { type: Number, default: 10, min: 1 },
    questions: { type: [questionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
