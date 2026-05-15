const Quiz = require("../models/Quiz");
const User = require("../models/User");

function toClient(doc, withAnswers) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  const qs = (o.questions || []).map((q) => {
    const base = {
      id: q.id,
      text: q.text,
      options: q.options,
      points: q.points,
      timeLimitSec: q.timeLimitSec,
    };
    if (withAnswers) return { ...base, correctIndex: q.correctIndex };
    return base;
  });
  return {
    _id: String(o._id),
    title: o.title,
    competitive: !!o.competitive,
    questions: qs,
    createdAt: o.createdAt,
  };
}

exports.listQuizzes = async (req, res) => {
  try {
    const rows = await Quiz.find().sort({ createdAt: -1 }).limit(200);
    res.json(rows.map((r) => toClient(r, false)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const q = await Quiz.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Quiz not found" });
    const isEditor = ["admin", "organizer"].includes(req.user.role);
    res.json(toClient(q, isEditor));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, competitive, questions } = req.body;
    const doc = await Quiz.create({
      title: String(title || "Вікторина").trim(),
      competitive: competitive !== false,
      questions: Array.isArray(questions) ? questions : [],
      createdBy: req.user.id,
    });
    res.status(201).json(toClient(doc, true));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const doc = await Quiz.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Quiz not found" });
    if (req.body.title !== undefined) doc.title = String(req.body.title).trim();
    if (req.body.competitive !== undefined) doc.competitive = !!req.body.competitive;
    if (req.body.questions !== undefined) doc.questions = Array.isArray(req.body.questions) ? req.body.questions : [];
    await doc.save();
    res.json(toClient(doc, true));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const doc = await Quiz.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Quiz not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.gradeAnswer = async (req, res) => {
  try {
    const q = await Quiz.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Quiz not found" });
    const questionId = String(req.body?.questionId || "");
    const optionIndex = Number(req.body?.optionIndex);
    const question = (q.questions || []).find((row) => row.id === questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });
    const correct = optionIndex === Number(question.correctIndex);
    res.json({
      correct,
      basePoints: Number(question.points) || 500,
      timeLimitSec: Number(question.timeLimitSec) || 15,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.finishQuiz = async (req, res) => {
  try {
    const q = await Quiz.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Quiz not found" });

    const answers =
      req.body && typeof req.body.answers === "object" ? req.body.answers : null;
    let score = Number(req.body?.score);

    if (!Number.isFinite(score) && answers) {
      score = 0;
      for (const question of q.questions || []) {
        const picked = answers[question.id];
        if (picked !== undefined && Number(picked) === Number(question.correctIndex)) {
          score += Number(question.points) || 500;
        }
      }
    }

    if (!Number.isFinite(score)) {
      score = 0;
    }

    const questionCount = (q.questions || []).length;
    const maxReasonable = Math.max(500, questionCount * 2500);
    score = Math.max(-questionCount * 1000, Math.min(score, maxReasonable));

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "lifetimeStats.quizSessionsFinished": 1 },
      $max: { "lifetimeStats.quizBestScore": score },
    });
    const fresh = await User.findById(req.user.id).select("lifetimeStats");
    const st = fresh?.lifetimeStats || {};
    res.json({
      ok: true,
      score,
      quizBestScore: st.quizBestScore || score,
      quizSessionsFinished: st.quizSessionsFinished || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
