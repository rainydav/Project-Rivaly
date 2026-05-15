import { apiFetch } from './http';

export type EvaluationCriterion = { key: string; label: string };

export type TournamentDoc = {
  _id: string;
  name: string;
  description?: string;
  requirements?: string;
  rules?: string;
  status: 'DRAFT' | 'REGISTRATION' | 'RUNNING' | 'FINISHED';
  registrationStart: string;
  registrationEnd: string;
  startDate?: string;
  maxTeams?: number;
  format?: string;
  minTeamMembers?: number;
  maxTeamMembers?: number;
  showTeamsBeforeRegistrationEnd?: boolean;
  evaluationCriteria?: EvaluationCriterion[];
};

export type RoundDoc = {
  _id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'SUBMISSION_CLOSED' | 'EVALUATED';
  startsAt: string;
  deadline: string;
  evaluationDeadline?: string;
  minEvaluationsPerSubmission?: number;
  evaluationsPerJuror?: number;
};

export type TeamMember = { fullName: string; email: string; userId?: string };
export type TeamDoc = {
  _id: string;
  name: string;
  tournament: string | TournamentDoc;
  owner: string;
  captain: TeamMember;
  members: TeamMember[];
  organization?: string;
  contact?: string;
};

export async function fetchTournamentsList(): Promise<TournamentDoc[]> {
  const { ok, data } = await apiFetch<unknown>('/api/tournaments', { method: 'GET' });
  if (!ok || !Array.isArray(data)) return [];
  return data as TournamentDoc[];
}

export async function fetchTournamentBundle(id: string): Promise<{
  tournament: TournamentDoc;
  teams: TeamDoc[];
  rounds: RoundDoc[];
}> {
  const { ok, data, status } = await apiFetch<{
    tournament: TournamentDoc;
    teams: TeamDoc[];
    rounds?: RoundDoc[];
  }>(`/api/tournaments/${encodeURIComponent(id)}`, { method: 'GET' });
  if (!ok || !data?.tournament) {
    throw new Error(`Турнір не знайдено (${status})`);
  }
  return { tournament: data.tournament, teams: data.teams || [], rounds: data.rounds || [] };
}

export async function createTournamentApi(body: Partial<TournamentDoc>): Promise<TournamentDoc> {
  const { data, ok, status } = await apiFetch<TournamentDoc>('/api/tournaments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function updateTournamentApi(
  id: string,
  body: Partial<TournamentDoc>
): Promise<TournamentDoc> {
  const { data, ok, status } = await apiFetch<TournamentDoc>(`/api/tournaments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function deleteTournamentApi(id: string): Promise<void> {
  const { ok, status } = await apiFetch(`/api/tournaments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    parseJson: false,
  });
  if (!ok) throw new Error(`Не вдалося видалити (${status})`);
}
