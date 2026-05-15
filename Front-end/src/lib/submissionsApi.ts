import { apiFetch } from './http';

export type SubmissionDoc = {
  _id: string;
  githubUrl?: string;
  demoUrl?: string;
  liveDemoUrl?: string;
  description?: string;
  submittedAt?: string;
  lockedAt?: string;
};

export async function fetchMySubmissionApi(roundId: string): Promise<SubmissionDoc | null> {
  const { data, ok } = await apiFetch<SubmissionDoc | null>(
    `/submissions/rounds/${encodeURIComponent(roundId)}/me`,
    { method: 'GET' }
  );
  if (!ok) return null;
  return data;
}

export async function upsertSubmissionApi(
  roundId: string,
  body: {
    githubUrl: string;
    demoUrl: string;
    liveDemoUrl?: string;
    description?: string;
  }
): Promise<SubmissionDoc> {
  const { data, ok, status } = await apiFetch<SubmissionDoc>(
    `/submissions/rounds/${encodeURIComponent(roundId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  );
  if (!ok || !data) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data;
}

export async function closeRoundSubmissionsApi(roundId: string): Promise<void> {
  const { ok, status, data } = await apiFetch(`/submissions/rounds/${encodeURIComponent(roundId)}/close`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!ok) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
}
