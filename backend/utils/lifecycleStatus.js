const { maxStatus, maxRoundStatus } = require("./tournamentStatus");

/**
 * Ідеальний статус за календарем (без «регресу» REGISTRATION → DRAFT після закриття реєстрації).
 * Порядок у часі: DRAFT → REGISTRATION → RUNNING → FINISHED.
 */
const getAutoTournamentStatus = (tournament, rounds = [], now = new Date()) => {
  if (rounds.length > 0 && rounds.every((round) => round.status === "EVALUATED")) {
    return "FINISHED";
  }

  const regStart = tournament.registrationStart ? new Date(tournament.registrationStart) : null;
  const regEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null;

  if (regStart && now < regStart) {
    return "DRAFT";
  }

  if (regStart && regEnd && now >= regStart && now <= regEnd) {
    return "REGISTRATION";
  }

  if (regEnd && now > regEnd) {
    return "RUNNING";
  }

  return "DRAFT";
};

const getAutoRoundStatus = (round, now = new Date()) => {
  if (round.status === "EVALUATED") {
    return "EVALUATED";
  }

  if (now < round.startsAt) {
    return "DRAFT";
  }

  if (now >= round.startsAt && now <= round.deadline) {
    return "ACTIVE";
  }

  return "SUBMISSION_CLOSED";
};

const syncTournamentStatus = async (tournament, rounds = null) => {
  const tournamentRounds = rounds || [];
  const suggested = getAutoTournamentStatus(tournament, tournamentRounds);
  const nextStatus = maxStatus(tournament.status, suggested);

  if (tournament.status !== nextStatus) {
    tournament.status = nextStatus;
    await tournament.save();
  }

  return tournament;
};

const syncRoundStatus = async (round) => {
  const suggested = getAutoRoundStatus(round);
  const nextStatus = maxRoundStatus(round.status, suggested);

  if (round.status !== nextStatus) {
    round.status = nextStatus;
    await round.save();
  }

  return round;
};

module.exports = {
  getAutoTournamentStatus,
  getAutoRoundStatus,
  syncTournamentStatus,
  syncRoundStatus
};
