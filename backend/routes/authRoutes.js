const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { skipEmailVerification } = require("../config/env");
const { toPublicUser } = require("../utils/userDto");

const { sendMailSafe } = require("../config/email");

const router = express.Router();

const FRONTEND_APP_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

function cleanBaseUrl(url) {
  return String(url || "").trim().replace(/\/$/, "");
}

function getBackendAppUrl(req) {
  const configuredUrl = cleanBaseUrl(
    process.env.BACKEND_PUBLIC_URL || process.env.BASE_URL
  );

  if (configuredUrl) {
    return configuredUrl;
  }

  return `${req.protocol}://${req.get("host")}`;
}

/**
 * Видає access + refresh токени та зберігає refresh у користувача.
 */
async function issueTokens(user) {
  const accessToken = jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    },
    process.env.ACCESS_SECRET,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign({ id: user._id.toString() }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
}

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

function validateUsername(username) {
  const u = String(username || "").trim();
  if (u.length < 3 || u.length > 32) {
    return { ok: false, message: "Username: від 3 до 32 символів" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(u)) {
    return { ok: false, message: "Username: лише латиниця, цифри та _" };
  }
  return { ok: true, username: u };
}

/**
 * Реєстрація учасника / організатора: без автологіну, з листом підтвердження (якщо не dev/skip).
 */
async function handleRegister(req, res) {
  const { username, fullName = "", email, password, gender } = req.body;

  const uCheck = validateUsername(username);
  if (!uCheck.ok) {
    return res.status(400).json({ message: uCheck.message });
  }

  const em = normalizeEmail(email);
  if (!em || !password) {
    return res.status(400).json({ message: "email та password обовʼязкові" });
  }

  const [existingEmail, existingUsername] = await Promise.all([
    User.findOne({ email: em }),
    User.findOne({ username: uCheck.username }),
  ]);

  if (existingEmail) {
    return res.status(400).json({ message: "User already exists" });
  }
  if (existingUsername) {
    return res.status(400).json({ message: "Username already taken" });
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const displayName = String(fullName || "").trim() || uCheck.username;

  const user = new User({
    username: uCheck.username,
    fullName: displayName,
    email: em,
    password: hashedPassword,
    /** Самостійна реєстрація завжди як учасник; інші ролі — через адмін-консоль */
    role: "participant",
    gender: ["male", "female", "other"].includes(gender) ? gender : "other",
    isVerified: skipEmailVerification(),
  });

  await user.save();

  if (!skipEmailVerification()) {
    const verifyToken = jwt.sign({ id: user._id }, process.env.VERIFY_SECRET, { expiresIn: "1d" });
    const verifyBase = cleanBaseUrl(process.env.BACKEND_PUBLIC_URL || process.env.BASE_URL) || getBackendAppUrl(req);
    const verifyLink = `${verifyBase}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`;

    try {
      await sendMailSafe({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Підтвердіть email для Rivaly.</p><p><a href="${verifyLink}">Підтвердити email</a></p>`,
      });
    } catch (e) {
      console.error("[auth] verify email send failed:", e.message, e.code || "");
      await User.findByIdAndDelete(user._id);
      const hint =
        e.code === "SMTP_NOT_CONFIGURED" || e.code === "SMTP_USER_MISSING"
          ? "Налаштуйте SMTP_USER та EMAIL_PASS у backend/.env і перезапустіть сервер з папки backend."
          : "Перевірте Gmail App Password і консоль backend (часто Gmail блокує вхід з нового IP).";
      return res.status(502).json({
        message: `Не вдалося надіслати лист підтвердження. ${hint}`,
      });
    }
  }

  return res.status(201).json({
    message: skipEmailVerification()
      ? "Користувача створено. Можете увійти."
      : "Користувача створено. Перевірте пошту та підтвердіть email перед входом.",
  });
}

router.post("/register", handleRegister);

/**
 * Зворотна сумісність: те саме, що /register (без токенів у відповіді).
 */
router.post("/signup", handleRegister);

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.VERIFY_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).send("User not found");
    }

    user.isVerified = true;
    await user.save();

    res.send("Email verified successfully");
  } catch (err) {
    res.status(400).send("Invalid or expired token");
  }
});

/**
 * Вхід за email/password для будь-якої ролі в БД.
 * Параметр loginPortal зі старих клієнтів ігнорується (окремих «входів» для журі/адміна більше немає).
 */
router.post("/login", async (req, res) => {
  void req.body.loginPortal;
  const { email, password } = req.body;

  const user = await User.findOne({ email: normalizeEmail(email) });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(String(password), user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Wrong password" });
  }

  if (!user.isVerified && !skipEmailVerification()) {
    return res.status(400).json({ message: "Email not verified" });
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  res.json({
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  });
});

/** Мінімальні дані користувача для фронтенду після перезавантаження */
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ user: toPublicUser(user) });
});

router.post("/logout", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  user.refreshToken = null;
  await user.save();

  res.json({ message: "Logged out successfully" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: normalizeEmail(email) });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const resetToken = jwt.sign({ id: user._id }, process.env.RESET_SECRET, { expiresIn: "15m" });

  const resetLink = `${FRONTEND_APP_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  try {
    await sendMailSafe({
      to: user.email,
      subject: "Reset password",
      html: `<p>Скидання пароля Rivaly.</p><p><a href="${resetLink}">Задати новий пароль</a></p>`,
    });
  } catch (e) {
    console.warn("[auth] reset email failed:", e.message);
    return res.status(502).json({ message: "Не вдалося надіслати лист. Перевірте SMTP на сервері." });
  }

  res.json({ message: "Reset email sent" });
});

/** Токен у тілі JSON (SPA з query ?token=). Має бути перед маршрутом з :token. */
router.post("/reset-password", async (req, res) => {
  const token = req.body.token;
  const { newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: "token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.RESET_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.RESET_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken: newAccessToken, user: toPublicUser(user) });
  } catch (err) {
    return res.status(403).json({ message: "Expired refresh token" });
  }
});

module.exports = router;
