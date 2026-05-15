const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const mongoose = require("mongoose");

function toDto(raw) {
  const o = raw && raw.toObject ? raw.toObject() : raw;
  if (!o) return null;
  return {
    id: String(o._id),
    roomId: o.roomId,
    userId: o.userId ? String(o.userId) : "",
    userName: o.userName,
    text: o.text,
    kind: o.kind === "sticker" ? "sticker" : "text",
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
  };
}

exports.listMessages = async (req, res) => {
  try {
    const roomId = String(req.query.room || "global");
    const rows = await ChatMessage.find({ roomId }).sort({ createdAt: 1 }).limit(300).lean();
    const out = rows.map((r) => toDto(r));
    if (roomId === "global" && out.length === 0) {
      out.push({
        id: "sys-welcome",
        roomId: "global",
        userId: "sys",
        userName: "Rivaly",
        text: "Вітаємо в загальному чаті. Поважайте одне одного — модерація активна.",
        kind: "text",
        createdAt: new Date().toISOString(),
      });
    }
    res.json({ messages: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const roomId = String(req.body.roomId || "global");
    const text = String(req.body.text || "").trim();
    const kind = req.body.kind === "sticker" ? "sticker" : "text";
    if (!text) return res.status(400).json({ message: "text required" });
    const u = await User.findById(req.user.id).select("fullName username");
    const userName =
      (u && u.fullName && String(u.fullName).trim()) ||
      (u && u.username) ||
      req.user.username ||
      "User";
    const doc = await ChatMessage.create({
      roomId,
      userId: new mongoose.Types.ObjectId(req.user.id),
      userName,
      text,
      kind,
    });
    res.status(201).json(toDto(doc));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const id = req.params.id;
    if (id === "sys-welcome") {
      return res.status(400).json({ message: "Cannot delete system message" });
    }
    const doc = await ChatMessage.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
