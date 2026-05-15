const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const User = require("../models/User");
const Submission = require("../models/Submission");
const { syncTournamentStatus } = require("../utils/lifecycleStatus");
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const assertRegistrationOpen = (tournament) => {
  const now = new Date();
  return tournament.status === "REGISTRATION" &&
    now >= tournament.registrationStart &&
    now <= tournament.registrationEnd;
};

const getMemberEmails = (captain, members) => {
  return [
    normalizeEmail(captain?.email),
    ...members.map((member) => normalizeEmail(member.email))
  ].filter(Boolean);
};

const validateTeamPayload = (tournament, captain, members) => {
  if (!captain?.fullName || !captain?.email) {
    return "Captain fullName and email are required";
  }

  if (!Array.isArray(members)) {
    return "Members must be an array";
  }

  const totalMembers = members.length + 1;

  if (totalMembers < tournament.minTeamMembers || totalMembers > tournament.maxTeamMembers) {
    return `Team must have from ${tournament.minTeamMembers} to ${tournament.maxTeamMembers} members including captain`;
  }

  if (members.some((member) => !member.fullName || !member.email)) {
    return "Each member must have fullName and email";
  }

  const emails = getMemberEmails(captain, members);
  const uniqueEmails = new Set(emails);

  if (emails.length !== uniqueEmails.size) {
    return "Emails must be unique inside one team";
  }

  return null;
};

exports.createTeam = async (req, res) => {
  try {
    const { name, tournamentId, captain, members = [], organization = "", contact = "" } = req.body;
    const userId = req.user.id;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    await syncTournamentStatus(tournament);

    if (!assertRegistrationOpen(tournament)) {
      return res.status(400).json({ message: "Registration is not active" });
    }

    if (tournament.maxTeams) {
      const teamsCount = await Team.countDocuments({ tournament: tournamentId });

      if (teamsCount >= tournament.maxTeams) {
        return res.status(400).json({ message: "Tournament team limit reached" });
      }
    }

    const payloadError = validateTeamPayload(tournament, captain, members);

    if (payloadError) {
      return res.status(400).json({ message: payloadError });
    }

    const emails = getMemberEmails(captain, members);
    const duplicateTeam = await Team.findOne({
      tournament: tournamentId,
      $or: [
        { name },
        { "captain.email": normalizeEmail(captain.email) },
        { "members.email": { $in: emails } }
      ]
    });

    if (duplicateTeam) {
      return res.status(400).json({ message: "Team duplicate detected" });
    }

    const existingOwnerTeam = await Team.findOne({ tournament: tournamentId, owner: userId });
    if (existingOwnerTeam) {
      return res.status(400).json({ message: "You already have a team in this tournament" });
    }

    const team = await Team.create({
      name,
      tournament: tournamentId,
      owner: userId,
      captain: {
        fullName: captain.fullName,
        email: normalizeEmail(captain.email)
      },
      members: members.map((member) => ({
        fullName: member.fullName,
        email: normalizeEmail(member.email)
      })),
      organization,
      contact
    });

    await User.findByIdAndUpdate(userId, { $inc: { "lifetimeStats.tournamentsJoined": 1 } });

    res.status(201).json(team);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const team = await Team.findById(req.params.id).populate("tournament");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    await syncTournamentStatus(team.tournament);

    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not owner" });
    }

    if (!assertRegistrationOpen(team.tournament)) {
      return res.status(400).json({ message: "Team editing is closed" });
    }

    if (!fullName || !email) {
      return res.status(400).json({ message: "fullName and email are required" });
    }

    if (team.members.length + 1 >= team.tournament.maxTeamMembers) {
      return res.status(400).json({ message: "Team full" });
    }

    const normalizedEmail = normalizeEmail(email);
    const emails = getMemberEmails(team.captain, team.members);

    if (emails.includes(normalizedEmail)) {
      return res.status(400).json({ message: "Already in team" });
    }

    const inOtherTeam = await Team.findOne({
      tournament: team.tournament._id,
      _id: { $ne: team._id },
      $or: [
        { "captain.email": normalizedEmail },
        { "members.email": normalizedEmail }
      ]
    });

    if (inOtherTeam) {
      return res.status(400).json({ message: "Email is already registered in this tournament" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    team.members.push({
      fullName,
      email: normalizedEmail,
      userId: user?._id
    });

    await team.save();
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { email } = req.body;
    const team = await Team.findById(req.params.id).populate("tournament");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    await syncTournamentStatus(team.tournament);

    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not owner" });
    }

    if (!assertRegistrationOpen(team.tournament)) {
      return res.status(400).json({ message: "Team editing is closed" });
    }

    if (team.members.length <= team.tournament.minTeamMembers - 1) {
      return res.status(400).json({ message: "Team cannot have fewer members" });
    }

    team.members = team.members.filter((member) => member.email !== normalizeEmail(email));
    await team.save();

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("tournament");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    await syncTournamentStatus(team.tournament);

    const isOwner = team.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!isAdmin && !assertRegistrationOpen(team.tournament)) {
      return res.status(400).json({ message: "Team editing is closed" });
    }

    const allowedFields = ["name", "organization", "contact", "availability"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        team[field] = req.body[field];
      }
    }

    await team.save();
    res.json(team);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const filter = req.query.tournamentId ? { tournament: req.query.tournamentId } : {};
    const teams = await Team.find(filter).populate("tournament", "name status");
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("tournament");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = team.owner.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!isAdmin) {
      await syncTournamentStatus(team.tournament);
      if (!assertRegistrationOpen(team.tournament)) {
        return res.status(400).json({ message: "Видалення команди недоступне після закриття реєстрації" });
      }
    }

    await Submission.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);
    res.json({ message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
