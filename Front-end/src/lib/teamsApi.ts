import { apiFetch } from './http';
import type { TeamDoc } from './tournamentsApi';

export async function createTeamApi(payload: {
  name: string;
  tournamentId: string;
  captain: { fullName: string; email: string };
  members: { fullName: string; email: string }[];
  organization?: string;
  contact?: string;
}): Promise<TeamDoc> {
  const { data, ok, status } = await apiFetch<TeamDoc>('/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function addTeamMemberApi(
  teamId: string,
  body: { fullName: string; email: string }
): Promise<TeamDoc> {
  const { data, ok, status } = await apiFetch<TeamDoc>(`/teams/${encodeURIComponent(teamId)}/members`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function removeTeamMemberApi(teamId: string, email: string): Promise<TeamDoc> {
  const { data, ok, status } = await apiFetch<TeamDoc>(
    `/teams/${encodeURIComponent(teamId)}/remove-member`,
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    }
  );
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function updateTeamNameApi(
  teamId: string,
  body: { name: string }
): Promise<TeamDoc> {
  const { data, ok, status } = await apiFetch<TeamDoc>(`/teams/${encodeURIComponent(teamId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function deleteTeamApi(teamId: string): Promise<void> {
  const { ok, status } = await apiFetch(`/teams/${encodeURIComponent(teamId)}`, {
    method: 'DELETE',
    parseJson: false,
  });
  if (!ok) throw new Error(`Не вдалося видалити команду (${status})`);
}
