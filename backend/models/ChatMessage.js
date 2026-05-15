const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    kind: { type: String, enum: ["text", "sticker"], default: "text" },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
