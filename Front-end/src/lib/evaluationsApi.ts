import { apiFetch } from './http';
import type { EvaluationCriterion } from './tournamentsApi';

export type JuryAssignment = {
  _id: string;
  status: 'ASSIGNED' | 'EVALUATED';
  submission: {
    _id: string;
    githubUrl?: string;
    demoUrl?: string;
    liveDemoUrl?: string;
    team?: { name?: string };
  };
  round: { _id: string; title: string; status: string };
  tournament?: { name?: string; evaluationCriteria?: EvaluationCriterion[] };
};

export async function fetchMyJuryAssignmentsApi(): Promise<JuryAssignment[]> {
  const { data, ok } = await apiFetch<JuryAssignment[]>('/evaluations/assignments/me', { method: 'GET' });
  if (!ok || !Array.isArray(data)) return [];
  return data;
}

export async function submitJuryEvaluationApi(
  assignmentId: string,
  body: { scores: Record<string, number>; comment?: string }
): Promise<void> {
  const { ok, status, data } = await apiFetch(`/evaluations/assignments/${encodeURIComponent(assignmentId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!ok) {
    const msg = (data as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
}

export async function assignJuryToRoundApi(
  roundId: string,
  opts?: { minPerSubmission?: number; evaluationsPerJuror?: number }
): Promise<void> {
  const { ok, status, data } = await apiFetch(
    `/evaluations/rounds/${encodeURIComponent(roundId)}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({
        minPerSubmission: opts?.minPerSubmission,
        evaluationsPerJuror: opts?.evaluationsPerJuror,
      }),
    }
  );
  if (!ok) {
    const msg = (data as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
}
