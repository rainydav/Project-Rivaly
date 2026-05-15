const mongoose = require("mongoose");

/**
 * Користувач платформи Rivaly.
 * role: judge = журі у бекенді (оцінки), у фронтенді відображається як "jury".
 * organizer = організатор турнірів / курсів.
 */
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["participant", "judge", "admin", "organizer"],
      default: "participant",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: String,
    /** Профіль (узгоджено з фронтендом) */
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    bio: { type: String, default: "" },
    title: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    /** Накопичувальна статистика (не зменшується при видаленні турніру/тесту на платформі) */
    lifetimeStats: {
      tournamentsJoined: { type: Number, default: 0 },
      coursesCompleted: { type: Number, default: 0 },
      testsPassed: { type: Number, default: 0 },
      testsTaken: { type: Number, default: 0 },
      /** Найкращий результат одного проходження тесту (бали), окремо від вікторин */
      testBestScore: { type: Number, default: 0 },
      quizSessionsFinished: { type: Number, default: 0 },
      quizBestScore: { type: Number, default: 0 },
    },
    completedCourseIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
