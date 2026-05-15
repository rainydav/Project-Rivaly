import { apiFetch } from './http';

/**
 * Миттєве збереження відповіді тесту (узгоджено з бекендом PATCH /api/attempts/answer).
 */
export async function patchAnswer(payload: {
  attemptId: string;
  questionId: string;
  answer: number | null;
  violationDelta?: number;
}): Promise<{ ok: boolean }> {
  const { ok, data } = await apiFetch<{ ok?: boolean }>('/api/attempts/answer', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!ok) {
    // eslint-disable-next-line no-console
    console.warn('[attempts] PATCH answer failed', data);
  }
  return { ok: !!ok };
}

/** Події змагальної вікторини (лог на бекенді) */
export async function patchCompetitiveStats(payload: Record<string, unknown>) {
  const { ok } = await apiFetch('/api/attempts/live-stats', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { ok: !!ok };
}
