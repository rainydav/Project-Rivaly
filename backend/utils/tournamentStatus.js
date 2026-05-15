/** Порядок статусів турніру (лише вперед, без повернення назад). */
const ORDER = {
  DRAFT: 0,
  REGISTRATION: 1,
  RUNNING: 2,
  FINISHED: 3,
};

function statusRank(status) {
  return ORDER[status] ?? -1;
}

function maxStatus(a, b) {
  return statusRank(a) >= statusRank(b) ? a : b;
}

/** Чи дозволено перехід з `from` у `to` (без регресу). */
function canAdvanceTo(from, to) {
  return statusRank(to) >= statusRank(from);
}

/** Статуси раунду (лише вперед при авто-синхронізації за часом). */
const ROUND_ORDER = {
  DRAFT: 0,
  ACTIVE: 1,
  SUBMISSION_CLOSED: 2,
  EVALUATED: 3,
};

function roundRank(status) {
  return ROUND_ORDER[status] ?? -1;
}

function maxRoundStatus(a, b) {
  return roundRank(a) >= roundRank(b) ? a : b;
}

module.exports = {
  ORDER,
  statusRank,
  maxStatus,
  canAdvanceTo,
  ROUND_ORDER,
  roundRank,
  maxRoundStatus,
};
