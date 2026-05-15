const User = require("../models/User");
const Round = require("../models/Round");
const Submission = require("../models/Submission");
const EvaluationAssignment = require("../models/EvaluationAssignment");
const Evaluation = require("../models/Evaluation");
const allocateAssignments = require("../utils/assignmentAllocator");
const { calculateTotalScore, validateScores, getCriteriaKeys } = require("../utils/evaluationScoring");
const { syncRoundStatus } = require("../utils/lifecycleStatus");

exports.assignSubmissions = async (req, res) => {
  try {
    const round = await Round.findById(req.params.roundId);

    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    await syncRoundStatus(round);

    if (round.status !== "SUBMISSION_CLOSED") {
      return res.status(400).json({ message: "Submissions must be closed before assignment" });
    }

    const minPerSubmission = Number(req.body.minPerSubmission || round.minEvaluationsPerSubmission);
    const evaluationsPerJuror = Number(req.body.evaluationsPerJuror || round.evaluationsPerJuror);

    const [submissions, juries] = await Promise.all([
      Submission.find({ round: round._id }),
      User.find({ role: "judge" }).select("_id username email role")
    ]);

    if (submissions.length === 0) {
      return res.status(400).json({ message: "No submissions to assign" });
    }

    if (juries.length === 0) {
      return res.status(400).json({ message: "No jury users found" });
    }

    await EvaluationAssignment.deleteMany({ round: round._id });

    const assignments = allocateAssignments(
      submissions,
      juries,
      minPerSubmission,
      evaluationsPerJuror
    );

    if (assignments.length < submissions.length * minPerSubmission) {
      return res.status(400).json({
        message: "Not enough jury capacity for requested assignment settings"
      });
    }

    const created = await EvaluationAssignment.insertMany(assignments);

    res.status(201).json({
      count: created.length,
      assignments: created
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const assignments = await EvaluationAssignment.find({ jury: req.user.id })
      .populate({
        path: "submission",
        populate: { path: "team", select: "name captain organization" }
      })
      .populate("round", "title status deadline evaluationDeadline")
      .populate("tournament", "name evaluationCriteria")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitEvaluation = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { scores, comment = "" } = req.body;

    const assignment = await EvaluationAssignment.findById(assignmentId)
      .populate("submission")
      .populate("round")
      .populate("tournament", "evaluationCriteria");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await syncRoundStatus(assignment.round);

    if (assignment.jury.toString() !== req.user.id) {
      return res.status(403).json({ message: "This work is not assigned to you" });
    }

    if (assignment.round.status !== "SUBMISSION_CLOSED" && assignment.round.status !== "EVALUATED") {
      return res.status(400).json({ message: "Evaluation is not open" });
    }

    const criteriaKeys = getCriteriaKeys(assignment.tournament?.evaluationCriteria);
    const scoreError = validateScores(scores, criteriaKeys);

    if (scoreError) {
      return res.status(400).json({ message: scoreError });
    }

    const totalScore = calculateTotalScore(scores, criteriaKeys);
    const tournamentId = assignment.tournament?._id || assignment.tournament;
    const evaluation = await Evaluation.findOneAndUpdate(
      { submission: assignment.submission._id, jury: req.user.id },
      {
        tournament: tournamentId,
        round: assignment.round._id,
        submission: assignment.submission._id,
        team: assignment.submission.team,
        jury: req.user.id,
        scores,
        totalScore,
        comment
      },
      { new: true, upsert: true, runValidators: true }
    );

    assignment.status = "EVALUATED";
    await assignment.save();

    res.json(evaluation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.finishEvaluation = async (req, res) => {
  try {
    const round = await Round.findById(req.params.roundId);

    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }

    round.status = "EVALUATED";
    await round.save();

    res.json(round);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoundEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ round: req.params.roundId })
      .populate("team", "name captain organization")
      .populate("jury", "username email")
      .populate("submission", "githubUrl demoUrl liveDemoUrl");

    res.json(evaluations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
