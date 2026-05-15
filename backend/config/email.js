const nodemailer = require("nodemailer");

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

let transporter = null;

function getMailTransporter() {
  if (!SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendMailSafe(options) {
  if (!SMTP_PASS) {
    const err = new Error("SMTP is not configured (set SMTP_PASS or EMAIL_PASS in backend/.env)");
    err.code = "SMTP_NOT_CONFIGURED";
    throw err;
  }
  if (!SMTP_USER) {
    const err = new Error("SMTP user is empty (set SMTP_USER or EMAIL_USER to your Gmail address)");
    err.code = "SMTP_USER_MISSING";
    throw err;
  }
  const tx = getMailTransporter();
  return tx.sendMail({
    from: SMTP_FROM || SMTP_USER,
    ...options,
  });
}

/** Перевірка SMTP при старті (лог у консоль, сервер не падає). */
async function logSmtpStatus() {
  const passSet = Boolean(SMTP_PASS);
  const userSet = Boolean(SMTP_USER);
  if (!passSet || !userSet) {
    console.warn(
      "[email] SMTP не налаштовано повністю:",
      !userSet ? "немає SMTP_USER/EMAIL_USER" : "",
      !passSet ? "немає SMTP_PASS/EMAIL_PASS" : ""
    );
    return;
  }
  try {
    const tx = getMailTransporter();
    await tx.verify();
    console.log("[email] SMTP OK (Gmail), відправник:", SMTP_FROM || SMTP_USER);
  } catch (err) {
    console.error("[email] SMTP verify failed:", err.message);
    console.error(
      "[email] На інших ПК часто: інший каталог запуску, Gmail блокує IP, або немає App Password."
    );
  }
}

module.exports = {
  SMTP_FROM,
  SMTP_USER,
  getMailTransporter,
  sendMailSafe,
  logSmtpStatus,
};
