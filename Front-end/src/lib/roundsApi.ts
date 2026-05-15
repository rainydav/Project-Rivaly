import { apiFetch } from './http';
import type { RoundDoc } from './tournamentsApi';

export type CreateRoundPayload = {
  title: string;
  description: string;
  startsAt: string;
  deadline: string;
  evaluationDeadline?: string;
  technologyRequirements?: string;
  minEvaluationsPerSubmission?: number;
  evaluationsPerJuror?: number;
  status?: 'DRAFT' | 'ACTIVE';
};

export async function fetchTournamentRoundsApi(tournamentId: string): Promise<RoundDoc[]> {
  const { ok, data, status } = await apiFetch<RoundDoc[]>(
    `/api/tournaments/${encodeURIComponent(tournamentId)}/rounds`,
    { method: 'GET' }
  );
  if (!ok || !Array.isArray(data)) {
    throw new Error(`Не вдалося завантажити раунди (${status})`);
  }
  return data;
}

export async function createRoundApi(
  tournamentId: string,
  body: CreateRoundPayload
): Promise<RoundDoc> {
  const { ok, data, status } = await apiFetch<RoundDoc>(
    `/api/tournaments/${encodeURIComponent(tournamentId)}/rounds`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function updateRoundApi(
  roundId: string,
  body: Partial<CreateRoundPayload>
): Promise<RoundDoc> {
  const { ok, data, status } = await apiFetch<RoundDoc>(`/rounds/${encodeURIComponent(roundId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function changeRoundStatusApi(
  roundId: string,
  status: RoundDoc['status']
): Promise<RoundDoc> {
  const { ok, data, status: httpStatus } = await apiFetch<RoundDoc>(
    `/rounds/${encodeURIComponent(roundId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${httpStatus})`;
    throw new Error(msg);
  }
  return data;
}
