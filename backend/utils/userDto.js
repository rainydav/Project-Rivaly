/**
 * Мапінг між моделлю User (Mongo) та полями, які очікує фронтенд Rivaly.
 * У БД роль журі зберігається як "judge" (історична назва), у UI — "jury".
 */

const FRONT_TO_DB = {
  participant: "participant",
  organizer: "organizer",
  jury: "judge",
  admin: "admin",
};

const DB_TO_FRONT = {
  participant: "participant",
  organizer: "organizer",
  judge: "jury",
  admin: "admin",
};

function mapRoleToDb(frontRole) {
  return FRONT_TO_DB[frontRole] || "participant";
}

function mapRoleToFront(dbRole) {
  return DB_TO_FRONT[dbRole] || "participant";
}

/**
 * Публічний обʼєкт користувача для API / фронтенду (без паролів і токенів).
 */
function toPublicUser(userDoc) {
  if (!userDoc) return null;
  const u = userDoc.toObject ? userDoc.toObject() : userDoc;
  const st = u.lifetimeStats || {};
  const testsTaken = st.testsTaken || 0;
  const testsPassed = st.testsPassed || 0;
  return {
    id: String(u._id),
    name: u.fullName || u.username || "",
    email: u.email,
    role: mapRoleToFront(u.role),
    gender: u.gender || "other",
    bio: u.bio || "",
    title: u.title || "",
    avatarUrl:
      (u.avatarUrl && String(u.avatarUrl).trim()) ||
      `https://i.pravatar.cc/200?u=${encodeURIComponent(String(u._id))}`,
    username: u.username,
    isVerified: !!u.isVerified,
    stats: {
      tournamentsJoined: st.tournamentsJoined || 0,
      coursesCompleted: st.coursesCompleted || 0,
      testsPassed,
      testsTaken,
      testPassPercent: testsTaken > 0 ? Math.round((testsPassed / testsTaken) * 100) : 0,
      testBestScore: st.testBestScore || 0,
      quizBestScore: st.quizBestScore || 0,
      quizSessionsFinished: st.quizSessionsFinished || 0,
    },
  };
}

module.exports = {
  mapRoleToDb,
  mapRoleToFront,
  toPublicUser,
};
