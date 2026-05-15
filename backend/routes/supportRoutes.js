const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const { sendMailSafe } = require("../config/email");

const router = express.Router();

const SUPPORT_TO = process.env.SUPPORT_INBOX_EMAIL || "tadhakoteam@gmail.com";

/**
 * Лист у підтримку: Reply-To = email користувача з реєстрації.
 */
router.post("/contact", authMiddleware, async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message || message.length > 8000) {
      return res.status(400).json({ message: "Повідомлення обовʼязкове (до 8000 символів)" });
    }

    const user = await User.findById(req.user.id).select("email fullName username");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fromName = user.fullName || user.username || "Rivaly user";

    try {
      await sendMailSafe({
        to: SUPPORT_TO,
        replyTo: user.email,
        subject: `[Rivaly Підтримка] від ${fromName}`,
        text: `Від: ${user.email}\n\n${message}`,
      });
    } catch (e) {
      console.warn("[support] sendMail failed:", e.message);
      const hint =
        e.code === "SMTP_NOT_CONFIGURED"
          ? "Пошта не налаштована на сервері (SMTP_PASS)."
          : "Не вдалося надіслати лист. Спробуйте пізніше.";
      return res.status(502).json({ message: hint });
    }

    res.json({ message: "Повідомлення надіслано" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
