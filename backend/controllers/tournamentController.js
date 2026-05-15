const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Round = require("../models/Round");
const Submission = require("../models/Submission");
const Evaluation = require("../models/Evaluation");
const EvaluationAssignment = require("../models/EvaluationAssignment");
const TournamentEvent = require("../models/TournamentEvent");
const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");
const { syncTournamentStatus, syncRoundStatus } = require("../utils/lifecycleStatus");
const { canAdvanceTo } = require("../utils/tournamentStatus");

const parseDate = (value) => value ? new Date(value) : value;

const buildLeaderboard = async (tournamentId) => {
  const evaluations = await Evaluation.aggregate([
    { $match: { tournament: new mongoose.Types.ObjectId(tournamentId) } },
    {
      $group: {
        _id: "$team",
        totalScore: { $avg: "$totalScore" },
        evaluationsCount: { $sum: 1 }
      }
    },
    { $sort: { totalScore: -1 } }
  ]);

  const teams = await Team.find({ tournament: tournamentId });
  const teamById = new Map(teams.map((team) => [team._id.toString(), team]));

  return evaluations.map((row, index) => ({
    rank: index + 1,
    team: teamById.get(row._id.toString()),
    totalScore: Math.round(row.totalScore * 100) / 100,
    evaluationsCount: row.evaluationsCount
  }));
};

exports.createTournament = async (req, res) => {
  try {
    const tournament = await Tournament.create({
      ...req.body,
      registrationStart: parseDate(req.body.registrationStart),
      registrationEnd: parseDate(req.body.registrationEnd),
      startDate: parseDate(req.body.startDate),
      createdBy: req.user?.id,
      status: "DRAFT"
    });

    await syncTournamentStatus(tournament, []);

    res.status(201).json(tournament);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTournaments = async (req, res) => {
  try {
    const { status, archive } = req.query;
    const tournaments = await Tournament.find().sort({ createdAt: -1 });
    await Promise.all(tournaments.map((tournament) => syncTournamentStatus(tournament)));

    let filtered = tournaments;

    if (status) {
      filtered = filtered.filter((tournament) => tournament.status === status);
    }

    if (archive === "true") {
      filtered = filtered.filter((tournament) => tournament.status === "FINISHED");
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    await syncTournamentStatus(tournament);

    const now = new Date();
    const canShowTeams = tournament.showTeamsBeforeRegistrationEnd || now > tournament.registrationEnd;
    const [teams, rounds, announcements, schedule] = await Promise.all([
      canShowTeams ? Team.find({ tournament: tournament._id }).select("-availability") : [],
      Round.find({ tournament: tournament._id }).sort({ startsAt: 1 }),
      Announcement.find({ tournament: tournament._id }).sort({ createdAt: -1 }),
      TournamentEvent.find({ tournament: tournament._id }).sort({ startsAt: 1 })
    ]);

    await Promise.all(rounds.map((round) => syncRoundStatus(round)));
    await syncTournamentStatus(tournament, rounds);

    res.json({
      tournament,
      teams,
      rounds,
      announcements,
      schedule
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (req.body.status !== undefined) {
      const s = req.body.status;
      if (!["DRAFT", "REGISTRATION", "RUNNING", "FINISHED"].includes(s)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      if (!canAdvanceTo(tournament.status, s)) {
        return res.status(400).json({ message: "Cannot revert tournament status" });
      }
      tournament.status = s;
    }

    const dateKeys = new Set(["registrationStart", "registrationEnd", "startDate"]);
    const allowed = [
      "name",
      "description",
      "requirements",
      "rules",
      "startDate",
      "registrationStart",
      "registrationEnd",
      "maxTeams",
      "format",
      "minTeamMembers",
      "maxTeamMembers",
      "showTeamsBeforeRegistrationEnd"
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        tournament[key] = dateKeys.has(key) ? parseDate(req.body[key]) : req.body[key];
      }
    }

    if (req.body.evaluationCriteria !== undefined) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can set evaluation criteria" });
      }
      const raw = req.body.evaluationCriteria;
      if (!Array.isArray(raw)) {
        return res.status(400).json({ message: "evaluationCriteria must be an array" });
      }
      tournament.evaluationCriteria = raw
        .map((c) => ({
          key: String(c.key || "")
            .trim()
            .replace(/[^a-zA-Z0-9_]/g, ""),
          label: String(c.label || "").trim() || "Критерій"
        }))
        .filter((c) => c.key.length > 0);
    }

    await tournament.save();

    const rounds = await Round.find({ tournament: tournament._id });
    await Promise.all(rounds.map((round) => syncRoundStatus(round)));
    await syncTournamentStatus(tournament, rounds);

    res.json(tournament);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const tid = tournament._id;
    await Promise.all([
      EvaluationAssignment.deleteMany({ tournament: tid }),
      Evaluation.deleteMany({ tournament: tid }),
      Submission.deleteMany({ tournament: tid }),
      Round.deleteMany({ tournament: tid }),
      Team.deleteMany({ tournament: tid }),
      Announcement.deleteMany({ tournament: tid }),
      TournamentEvent.deleteMany({ tournament: tid })
    ]);
    await Tournament.findByIdAndDelete(tid);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    res.json(await buildLeaderboard(req.params.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportLeaderboardCsv = async (req, res) => {
  try {
    const rows = await buildLeaderboard(req.params.id);
    const header = "rank,team,totalScore,evaluationsCount";
    const lines = rows.map((row) => [
      row.rank,
      JSON.stringify(row.team?.name || ""),
      row.totalScore,
      row.evaluationsCount
    ].join(","));

    res.setHeader("Content-Type", "text/csv");
    res.send([header, ...lines].join("\n"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = await TournamentEvent.create({
      ...req.body,
      tournament: req.params.id,
      createdBy: req.user.id
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await TournamentEvent.findOneAndUpdate(
      { _id: req.params.eventId, tournament: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await TournamentEvent.findOneAndDelete({
      _id: req.params.eventId,
      tournament: req.params.id
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      tournament: req.params.id,
      createdBy: req.user.id
    });

    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.announcementId, tournament: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(announcement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.announcementId,
      tournament: req.params.id
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamDashboard = async (req, res) => {
  try {
    const teams = await Team.find({ owner: req.user.id }).populate("tournament");
    const teamIds = teams.map((team) => team._id);
    const submissions = await Submission.find({ team: { $in: teamIds } }).populate("round tournament");

    res.json({ teams, submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
