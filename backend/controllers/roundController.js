const Round = require("../models/Round");
const Tournament = require("../models/Tournament");
const { syncTournamentStatus, syncRoundStatus } = require("../utils/lifecycleStatus");

exports.createRound = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    await syncTournamentStatus(tournament);

    if (tournament.status === "FINISHED") {
      return res.status(400).json({ message: "Cannot add rounds to a finished tournament" });
    }

    const body = req.body || {};
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const deadline = body.deadline ? new Date(body.deadline) : null;

    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ message: "title is required" });
    }
    if (!body.description || !String(body.description).trim()) {
      return res.status(400).json({ message: "description is required" });
    }
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return res.status(400).json({ message: "startsAt is required" });
    }
    if (!deadline || Number.isNaN(deadline.getTime())) {
      return res.status(400).json({ message: "deadline is required" });
    }
    if (deadline <= startsAt) {
      return res.status(400).json({ message: "deadline must be after startsAt" });
    }

    const round = await Round.create({
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      technologyRequirements: String(body.technologyRequirements || "").trim(),
      mustHaveCriteria: Array.isArray(body.mustHaveCriteria) ? body.mustHaveCriteria : [],
      materials: Array.isArray(body.materials) ? body.materials : [],
      startsAt,
      deadline,
      evaluationDeadline: body.evaluationDeadline ? new Date(body.evaluationDeadline) : undefined,
      minEvaluationsPerSubmission: Number(body.minEvaluationsPerSubmission) || 2,
      evaluationsPerJuror: Number(body.evaluationsPerJuror) || 3,
      status: body.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
      tournament: tournament._id,
      createdBy: req.user.id,
    });

    await syncRoundStatus(round);

    res.status(201).json(round);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getRounds = async (req, res) => {
  try {
    const rounds = await Round.find({ tournament: req.params.tournamentId }).sort({ startsAt: 1 });
    await Promise.all(rounds.map((round) => syncRoundStatus(round)));
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRound = async (req, res) => {
  try {
    const round = await Round.findById(req.params.roundId).populate("tournament", "name status");

    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    await syncRoundStatus(round);
    res.json(round);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRound = async (req, res) => {
  try {
    const round = await Round.findByIdAndUpdate(
      req.params.roundId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    await syncRoundStatus(round);
    res.json(round);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changeRoundStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const round = await Round.findById(req.params.roundId);

    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    await syncRoundStatus(round);

    const flow = {
      DRAFT: ["ACTIVE"],
      ACTIVE: ["SUBMISSION_CLOSED"],
      SUBMISSION_CLOSED: ["EVALUATED"],
      EVALUATED: []
    };

    if (!flow[round.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot change from ${round.status} to ${status}` });
    }

    if (status === "ACTIVE") {
      const tournament = await Tournament.findById(round.tournament);

      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      if (tournament.status !== "RUNNING" || new Date() < tournament.registrationEnd) {
        return res.status(400).json({ message: "Round can start only after registration ends and tournament is running" });
      }
    }

    round.status = status;
    await round.save();

    res.json(round);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
