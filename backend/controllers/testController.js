const Test = require("../models/Test");
const User = require("../models/User");

const PASS_RATIO = 0.5;

function toClient(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(o._id),
    title: o.title,
    timerMinutes: o.timerMinutes,
    questions: (o.questions || []).map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      points: q.points,
    })),
    createdAt: o.createdAt,
  };
}

function toClientWithAnswers(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(o._id),
    title: o.title,
    timerMinutes: o.timerMinutes,
    questions: o.questions || [],
    createdAt: o.createdAt,
  };
}

exports.listTests = async (req, res) => {
  try {
    const rows = await Test.find().sort({ createdAt: -1 }).limit(200);
    res.json(rows.map((r) => toClient(r)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTest = async (req, res) => {
  try {
    const t = await Test.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Test not found" });
    res.json(toClient(t));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTestAdmin = async (req, res) => {
  try {
    const t = await Test.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Test not found" });
    res.json(toClientWithAnswers(t));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { title, timerMinutes, questions } = req.body;
    const t = await Test.create({
      title: String(title || "Тест").trim(),
      timerMinutes: Math.max(1, Number(timerMinutes) || 10),
      questions: Array.isArray(questions) ? questions : [],
      createdBy: req.user.id,
    });
    res.status(201).json(toClientWithAnswers(t));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const t = await Test.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Test not found" });
    if (req.body.title !== undefined) t.title = String(req.body.title).trim();
    if (req.body.timerMinutes !== undefined) t.timerMinutes = Math.max(1, Number(req.body.timerMinutes) || 10);
    if (req.body.questions !== undefined) t.questions = Array.isArray(req.body.questions) ? req.body.questions : [];
    await t.save();
    res.json(toClientWithAnswers(t));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const t = await Test.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: "Test not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitTest = async (req, res) => {
  try {
    const t = await Test.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Test not found" });
    const answers = req.body && typeof req.body.answers === "object" ? req.body.answers : {};
    let score = 0;
    let max = 0;
    for (const q of t.questions) {
      max += Number(q.points) || 0;
      const picked = answers[q.id];
      if (picked !== undefined && Number(picked) === Number(q.correctIndex)) {
        score += Number(q.points) || 0;
      }
    }
    const passed = max > 0 ? score / max >= PASS_RATIO : false;
    const inc = { "lifetimeStats.testsTaken": 1 };
    if (passed) inc["lifetimeStats.testsPassed"] = 1;
    await User.findByIdAndUpdate(req.user.id, {
      $inc: inc,
      $max: { "lifetimeStats.testBestScore": score },
    });

    res.json({
      score,
      maxScore: max,
      passed,
      ratio: max > 0 ? score / max : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
