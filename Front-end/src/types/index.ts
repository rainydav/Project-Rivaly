export type UserRole = 'participant' | 'organizer' | 'jury' | 'admin';

export type Gender = 'male' | 'female' | 'other';

export interface UserLifetimeStats {
  tournamentsJoined: number;
  coursesCompleted: number;
  testsPassed: number;
  testsTaken: number;
  testPassPercent: number;
  testBestScore: number;
  quizBestScore: number;
  quizSessionsFinished: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender: Gender;
  avatarUrl: string;
  bio: string;
  title: string;
  username?: string;
  isVerified?: boolean;
  stats?: UserLifetimeStats;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  kind: 'text' | 'sticker';
}

export interface ModerationConfig {
  bannedWords: string[];
  stickerTriggers: string[];
  banMinutes: number;
}

export interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz';
  content: string;
  quizId?: string;
  locked?: boolean;
}

export interface LiveSession {
  id: string;
  title: string;
  platform: 'Zoom' | 'Meet' | 'Інше';
  link: string;
  startAt: string;
  durationMin: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Початковий' | 'Середній' | 'Просунутий';
  estimatedHours: number;
  author: string;
  zoomLink?: string;
  gitLink?: string;
  siteLink?: string;
  modules: CourseModule[];
  sessions: LiveSession[];
  enrolled: boolean;
}

export interface TournamentConfig {
  id: string;
  title: string;
  submissionStart: string;
  submissionEnd: string;
  requiredJuryCount: number;
  allowedTypes: Array<'github' | 'video' | 'code' | 'photo'>;
  juryList: { name: string; photo: string; specialization: string }[];
}

export type QuestionStatus = 'pending' | 'done' | 'current' | 'review' | 'skipped';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex?: number;
  points: number;
}
