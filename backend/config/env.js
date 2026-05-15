/**
 * Завантаження .env та безпечні дефолти для локальної розробки.
 * У production обовʼязково задайте реальні секрети в .env (не покладайтесь на дефолти).
 *
 * Шлях привʼязаний до папки backend/, а не до process.cwd() — інакше при
 * `node backend/server.js` з кореня репо .env не підхоплюється (лише на одному ПК «випадково» працює).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const DEV_PLACEHOLDER = "dev-only-change-in-production-min-32-chars!!";

/**
 * Якщо змінні JWT відсутні і ми не в production — підставляємо тимчасові значення,
 * щоб сервер міг стартувати без ручного копіювання секретів.
 */
function ensureJwtSecrets() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const required = ["VERIFY_SECRET", "ACCESS_SECRET", "REFRESH_SECRET", "RESET_SECRET"];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(`Missing JWT secrets in production: ${missing.join(", ")}`);
    }
    return;
  }

  process.env.VERIFY_SECRET = process.env.VERIFY_SECRET || DEV_PLACEHOLDER;
  process.env.ACCESS_SECRET = process.env.ACCESS_SECRET || DEV_PLACEHOLDER;
  process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || DEV_PLACEHOLDER;
  process.env.RESET_SECRET = process.env.RESET_SECRET || DEV_PLACEHOLDER;
}

/**
 * Чи пропускати перевірку email після реєстрації (зручно для розробки та демо).
 */
function skipEmailVerification() {
  return (
    process.env.SKIP_EMAIL_VERIFY === "true" ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "dev"
  );
}

module.exports = {
  ensureJwtSecrets,
  skipEmailVerification,
};
