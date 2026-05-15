const Tournament = require("../models/Tournament");
const User = require("../models/User");
const Team = require("../models/Team");
const { toPublicUser } = require("../utils/userDto");

exports.getDashboardStats = async (req, res) => {
  try {
    const [activeTournaments, totalTournaments, usersCount, teamsCount] = await Promise.all([
      Tournament.countDocuments({ status: { $in: ["REGISTRATION", "RUNNING"] } }),
      Tournament.countDocuments({}),
      User.countDocuments({}),
      Team.countDocuments({}),
    ]);

    let myTeams = 0;
    if (req.user?.id) {
      myTeams = await Team.countDocuments({ owner: req.user.id });
    }

    res.json({
      activeTournaments,
      totalTournaments,
      usersCount,
      teamsCount,
      myTeams,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken").limit(200).lean();

    const rows = users.map((u) => {
      const pub = toPublicUser(u);
      const st = u.lifetimeStats || {};
      const testsTaken = st.testsTaken || 0;
      const testsPassed = st.testsPassed || 0;
      const testPct = testsTaken > 0 ? Math.round((testsPassed / testsTaken) * 100) : 0;
      const testScore = st.testBestScore || (st.testsPassed || 0) * 20;
      const quizScore = st.quizBestScore || 0;
      const tournamentScore = (st.tournamentsJoined || 0) * 15;
      const courseScore = (st.coursesCompleted || 0) * 10;
      const score = testScore + quizScore + tournamentScore + courseScore;
      return {
        rank: 0,
        user: pub,
        score,
        testScore,
        quizScore,
        tournamentScore,
        courseScore,
        tournamentsJoined: st.tournamentsJoined || 0,
        coursesCompleted: st.coursesCompleted || 0,
        testsPassed,
        testsTaken,
        testPassPercent: testPct,
        testBestScore: st.testBestScore || 0,
        quizBestScore: st.quizBestScore || 0,
        quizSessionsFinished: st.quizSessionsFinished || 0,
      };
    });

    rows.sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => {
      r.rank = i + 1;
    });

    res.json({ rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
