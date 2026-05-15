/**
 * Головний сервер API Rivaly.
 * Порядок: env → express → CORS → JSON → маршрути → MongoDB + планувальник.
 */
const { ensureJwtSecrets } = require("./config/env");
ensureJwtSecrets();

const express = require("express");
const cors = require("cors");

const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const connectDB = require("./config/db");
const { logSmtpStatus } = require("./config/email");
const { startStatusScheduler } = require("./utils/statusScheduler");

const app = express();

/**
 * CORS: у dev дозволяємо будь-який localhost / 127.0.0.1 з довільним портом (Vite часто 5173–5176).
 * У production — лише FRONTEND_URL з .env.
 */
const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const isProd = process.env.NODE_ENV === "production";

/** Додаткові джерела через кому: CORS_ORIGINS=https://a.com,https://b.com */
const extraOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOriginSet = new Set([FRONTEND_ORIGIN, ...extraOrigins]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOriginSet.has(origin.replace(/\/$/, ""))) return true;
  try {
    const u = new URL(origin);
    if (!isProd && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) {
      return true;
    }
    if (!isProd && /^192\.168\.\d+\.\d+$/.test(u.hostname)) {
      return true;
    }
    if (!isProd && /^10\.\d+\.\d+\.\d+$/.test(u.hostname)) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/authRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const teamRoutes = require("./routes/teamRoutes");
const roundRoutes = require("./routes/roundRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const testRoutes = require("./routes/testRoutes");
const quizRoutes = require("./routes/quizRoutes");
const statsRoutes = require("./routes/statsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const path = require("path");

/**
 * API під префіксом /api/auth — узгоджено з фронтендом (VITE_API_URL + /api/auth/login).
 */
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/support", require("./routes/supportRoutes"));

app.use("/api/users", require("./routes/userRoutes"));

/** Турніри: лише під /api, щоб не конфліктувати з маршрутом SPA `/tournaments` */
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/", roundRoutes);
app.use("/teams", teamRoutes);
app.use("/submissions", submissionRoutes);
app.use("/evaluations", evaluationRoutes);

connectDB().then(() => {
  startStatusScheduler();
  void logSmtpStatus();
});

const FRONTEND_DIST = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : "";

if (FRONTEND_DIST) {
  app.use(express.static(FRONTEND_DIST));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    const p = req.path || "";
    if (p.startsWith("/api")) return next();
    if (p.startsWith("/teams")) return next();
    if (p.startsWith("/submissions")) return next();
    if (p.startsWith("/evaluations")) return next();
    if (p.startsWith("/rounds")) return next();
    if (p === "/admin") return next();
    if (path.extname(p)) return next();
    return res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ ok: true, message: "Rivaly API", docs: "/api/auth/login, /api/tournaments" });
  });
}

app.get("/admin", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  res.send("ADMIN ONLY");
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[rivaly-api] listening on http://0.0.0.0:${PORT}`);
  console.log(`[rivaly-api] CORS origin: ${FRONTEND_ORIGIN}`);
});
