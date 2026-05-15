/**
 * Динамічні критерії оцінювання: за замовчуванням — класичний набір полів,
 * або масив evaluationCriteria з документа Tournament.
 */

const DEFAULT_EVALUATION_CRITERIA = [
  { key: "backendCodeQuality", label: "Якість backend-коду" },
  { key: "database", label: "База даних" },
  { key: "frontendCodeQuality", label: "Якість frontend" },
  { key: "mustHaveCompletion", label: "Must-have / повнота" },
  { key: "reliability", label: "Надійність" },
  { key: "usability", label: "Зручність (UX)" }
];

function sanitizeKey(raw) {
  const s = String(raw || "").trim().replace(/[^a-zA-Z0-9_]/g, "");
  return s || "";
}

function getCriteriaWithLabels(tournamentCriteria) {
  if (Array.isArray(tournamentCriteria) && tournamentCriteria.length > 0) {
    return tournamentCriteria
      .map((c) => ({
        key: sanitizeKey(c.key),
        label: String(c.label || "").trim() || "Критерій"
      }))
      .filter((c) => c.key.length > 0);
  }
  return DEFAULT_EVALUATION_CRITERIA;
}

function getCriteriaKeys(tournamentCriteria) {
  return getCriteriaWithLabels(tournamentCriteria).map((c) => c.key);
}

function validateScores(scores, keys) {
  if (!scores || typeof scores !== "object") {
    return "Scores are required";
  }

  for (const field of keys) {
    const value = scores[field];

    if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 100) {
      return `${field} must be a number from 0 to 100`;
    }
  }

  return null;
}

function calculateTotalScore(scores, keys) {
  if (!keys.length) return 0;
  const sum = keys.reduce((total, field) => total + Number(scores[field] ?? 0), 0);
  return Math.round((sum / keys.length) * 100) / 100;
}

module.exports = {
  DEFAULT_EVALUATION_CRITERIA,
  getCriteriaKeys,
  getCriteriaWithLabels,
  validateScores,
  calculateTotalScore
};
