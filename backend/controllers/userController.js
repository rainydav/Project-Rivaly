const User = require("../models/User");
const { mapRoleToDb, toPublicUser } = require("../utils/userDto");

function resolveDbRole(input) {
  if (!input) return null;
  if (["participant", "judge", "admin", "organizer"].includes(input)) {
    return input;
  }
  return mapRoleToDb(input);
}

// GET ALL (admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken").sort({ createdAt: -1 });
    res.json(users.map((u) => toPublicUser(u)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Пошук користувачів (імʼя, email, username)
exports.searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) {
      return res.json([]);
    }
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(esc, "i");
    const users = await User.find({
      $or: [{ username: re }, { email: re }, { fullName: re }],
    })
      .select("-password -refreshToken")
      .limit(30)
      .sort({ createdAt: -1 });
    res.json(users.map((u) => toPublicUser(u)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Публічний перегляд профілю (для будь-якого залогіненого користувача)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE ROLE (admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const dbRole = resolveDbRole(role);

    if (!dbRole || !["participant", "judge", "admin", "organizer"].includes(dbRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role: dbRole }, { new: true }).select(
      "-password -refreshToken"
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: toPublicUser(updatedUser) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE (admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (String(user._id) === String(req.user.id)) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
