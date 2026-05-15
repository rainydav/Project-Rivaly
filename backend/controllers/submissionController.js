const Round = require("../models/Round");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const { syncRoundStatus } = require("../utils/lifecycleStatus");

const canSubmit = (round) => {
  const now = new Date();
  return round.status === "ACTIVE" && now >= round.startsAt && now <= round.deadline;
};

exports.upsertSubmission = async (req, res) => {
  try {
    const { roundId } = req.params;
    const { githubUrl, demoUrl, liveDemoUrl = "", description = "" } = req.body;
    const round = await Round.findById(roundId);

    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    await syncRoundStatus(round);

    if (!canSubmit(round)) {
      return res.status(400).json({ message: "Submission is closed" });
    }

    if (!githubUrl || !demoUrl) {
      return res.status(400).json({ message: "githubUrl and demoUrl are required" });
    }

    const team = await Team.findOne({
      tournament: round.tournament,
      owner: req.user.id
    });

    if (!team) {
      return res.status(404).json({ message: "Team for this tournament not found" });
    }

    const submission = await Submission.findOneAndUpdate(
      { round: round._id, team: team._id },
      {
        tournament: round.tournament,
        round: round._id,
        team: team._id,
        githubUrl,
        demoUrl,
        liveDemoUrl,
        description,
        submittedAt: new Date(),
        lockedAt: undefined
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(submission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMySubmission = async (req, res) => {
  try {
    const { roundId } = req.params;
    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    const team = await Team.findOne({
      tournament: round.tournament,
      owner: req.user.id,
    });

    if (!team) {
      return res.json(null);
    }

    const submission = await Submission.findOne({
      round: round._id,
      team: team._id,
    });

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const filter = {};

    if (req.query.roundId) {
      filter.round = req.query.roundId;
    }

    if (req.query.tournamentId) {
      filter.tournament = req.query.tournamentId;
    }

    const submissions = await Submission.find(filter)
      .populate("team", "name captain organization")
      .populate("round", "title status deadline");

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.closeSubmissions = async (req, res) => {
  try {
    const round = await Round.findById(req.params.roundId);

    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    round.status = "SUBMISSION_CLOSED";
    await round.save();

    await Submission.updateMany(
      { round: round._id, lockedAt: { $exists: false } },
      { lockedAt: new Date() }
    );

    res.json({ message: "Submissions closed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
