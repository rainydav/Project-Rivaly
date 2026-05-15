const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const EvaluationAssignment = require("../models/EvaluationAssignment");
const Evaluation = require("../models/Evaluation");
const Tournament = require("../models/Tournament");
const Round = require("../models/Round");
const { toPublicUser } = require("../utils/userDto");

/**
 * Розширений профіль для кабінету (команда, подання, журі, турніри).
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = { user: toPublicUser(user) };

    if (user.role === "participant") {
      const teams = await Team.find({ owner: user._id }).populate("tournament", "name status");
      const teamIds = teams.map((team) => team._id);
      const submissions = await Submission.find({ team: { $in: teamIds } }).populate("round tournament");

      payload.teams = teams;
      payload.submissions = submissions;
    }

    if (user.role === "judge") {
      payload.assignments = await EvaluationAssignment.find({ jury: user._id })
        .populate("round", "title status")
        .populate("submission");
      payload.evaluations = await Evaluation.find({ jury: user._id })
        .populate("team", "name")
        .populate("round", "title");
    }

    if (user.role === "admin" || user.role === "organizer") {
      payload.tournaments = await Tournament.find({ createdBy: user._id });
      payload.rounds = await Round.find({ createdBy: user._id });
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function validateUsernameShape(username) {
  const u = String(username || "").trim();
  if (u.length < 3 || u.length > 32) {
    return { ok: false, message: "Username: від 3 до 32 символів" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(u)) {
    return { ok: false, message: "Username: лише латиниця, цифри та _" };
  }
  return { ok: true, username: u };
}

/**
 * Оновлення полів профілю з фронтенду (PATCH).
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, fullName, gender, bio, title, avatarUrl, username } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.fullName = String(fullName).trim();
    if (name !== undefined) updates.fullName = String(name).trim();
    if (gender !== undefined && ["male", "female", "other"].includes(gender)) {
      updates.gender = gender;
    }
    if (bio !== undefined) updates.bio = String(bio);
    if (title !== undefined) updates.title = String(title);
    if (avatarUrl !== undefined) {
      const av = String(avatarUrl);
      if (av.startsWith("blob:")) {
        return res.status(400).json({
          message: "Некоректне посилання на аватар. Завантажте файл знову (очікується зображення у форматі base64).",
        });
      }
      if (av.length > 450000) {
        return res.status(400).json({ message: "Зображення завелике для збереження в профілі (спробуйте менший файл)." });
      }
      updates.avatarUrl = av;
    }
    if (username !== undefined) {
      const uCheck = validateUsernameShape(username);
      if (!uCheck.ok) {
        return res.status(400).json({ message: uCheck.message });
      }
      const taken = await User.findOne({
        username: uCheck.username,
        _id: { $ne: req.user.id },
      }).select("_id");
      if (taken) {
        return res.status(400).json({ message: "Цей нікнейм уже зайнятий" });
      }
      updates.username = uCheck.username;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Позначити курс завершеним (один раз на courseId; збільшує лічильник у lifetimeStats).
 */
exports.completeCourse = async (req, res) => {
  try {
    const courseId = String(req.body.courseId || "").trim();
    if (!courseId) {
      return res.status(400).json({ message: "courseId required" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const ids = user.completedCourseIds || [];
    if (ids.map(String).includes(courseId)) {
      return res.json({ user: toPublicUser(user), alreadyCompleted: true });
    }
    user.completedCourseIds = [...ids, courseId];
    user.lifetimeStats = user.lifetimeStats || {};
    user.lifetimeStats.coursesCompleted = (user.lifetimeStats.coursesCompleted || 0) + 1;
    await user.save();
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
