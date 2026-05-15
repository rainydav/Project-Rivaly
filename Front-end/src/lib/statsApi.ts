import { apiFetch } from './http';

export type DashboardStats = {
  activeTournaments: number;
  totalTournaments: number;
  usersCount: number;
  teamsCount: number;
  myTeams: number;
};

export async function fetchDashboardStatsApi(): Promise<DashboardStats> {
  const { data, ok, status } = await apiFetch<DashboardStats>('/api/stats/dashboard', {
    method: 'GET',
  });
  if (!ok || !data) throw new Error(`Статистика (${status})`);
  return data;
}

export type LeaderboardRow = {
  rank: number;
  score: number;
  testScore: number;
  quizScore: number;
  tournamentsJoined: number;
  coursesCompleted: number;
  testsPassed: number;
  testsTaken: number;
  testPassPercent: number;
  quizBestScore: number;
  quizSessionsFinished: number;
  user: {
    id: string;
    name: string;
    username?: string;
    avatarUrl: string;
    role: string;
  };
};

export async function fetchLeaderboardApi(): Promise<LeaderboardRow[]> {
  const { data, ok, status } = await apiFetch<{ rows: LeaderboardRow[] }>(
    '/api/stats/leaderboard',
    { method: 'GET' }
  );
  if (!ok || !data?.rows) throw new Error(`Рейтинг (${status})`);
  return data.rows;
}
