const Tournament = require("../models/Tournament");
const Round = require("../models/Round");
const { syncTournamentStatus, syncRoundStatus } = require("./lifecycleStatus");

const STATUS_SYNC_INTERVAL_MS = 60 * 1000;

const syncAllStatuses = async () => {
  const now = new Date();
  const [tournaments, rounds] = await Promise.all([
    Tournament.find(),
    Round.find()
  ]);

  const roundsByTournament = new Map();

  for (const round of rounds) {
    await syncRoundStatus(round);

    const tournamentId = round.tournament.toString();
    const tournamentRounds = roundsByTournament.get(tournamentId) || [];
    tournamentRounds.push(round);
    roundsByTournament.set(tournamentId, tournamentRounds);
  }

  for (const tournament of tournaments) {
    const tournamentRounds = roundsByTournament.get(tournament._id.toString()) || [];
    await syncTournamentStatus(tournament, tournamentRounds);
  }
};

const startStatusScheduler = () => {
  syncAllStatuses().catch((err) => {
    console.error("Initial status sync failed:", err.message);
  });

  setInterval(() => {
    syncAllStatuses().catch((err) => {
      console.error("Status sync failed:", err.message);
    });
  }, STATUS_SYNC_INTERVAL_MS);
};

module.exports = {
  syncAllStatuses,
  startStatusScheduler
};
