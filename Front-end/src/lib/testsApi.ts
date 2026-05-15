import type { QuizQuestion } from '../types';
import { apiFetch } from './http';

export type TestDoc = {
  _id: string;
  title: string;
  timerMinutes: number;
  questions: QuizQuestion[];
  createdAt?: string;
};

export async function fetchTestsListApi(): Promise<TestDoc[]> {
  const { data, ok } = await apiFetch<TestDoc[]>('/api/tests', { method: 'GET' });
  if (!ok || !Array.isArray(data)) return [];
  return data;
}

export async function fetchTestByIdApi(id: string): Promise<TestDoc> {
  const { data, ok, status } = await apiFetch<TestDoc>(`/api/tests/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  if (!ok || !data) throw new Error(`Тест (${status})`);
  return data;
}

export async function fetchTestFullApi(id: string): Promise<TestDoc> {
  const { data, ok, status } = await apiFetch<TestDoc>(
    `/api/tests/${encodeURIComponent(id)}/full`,
    { method: 'GET' }
  );
  if (!ok || !data) throw new Error(`Тест (${status})`);
  return data;
}

export async function createTestApi(body: {
  title: string;
  timerMinutes: number;
  questions: QuizQuestion[];
}): Promise<TestDoc> {
  const { data, ok, status } = await apiFetch<TestDoc>('/api/tests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!ok || !data) throw new Error(`Не вдалося створити (${status})`);
  return data;
}

export async function updateTestApi(
  id: string,
  body: Partial<{ title: string; timerMinutes: number; questions: QuizQuestion[] }>
): Promise<TestDoc> {
  const { data, ok, status } = await apiFetch<TestDoc>(`/api/tests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!ok || !data) throw new Error(`Не вдалося зберегти (${status})`);
  return data;
}

export async function deleteTestApi(id: string): Promise<void> {
  const { ok, status } = await apiFetch(`/api/tests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    parseJson: false,
  });
  if (!ok) throw new Error(`Видалення (${status})`);
}

export async function submitTestApi(
  id: string,
  answers: Record<string, number | null>
): Promise<{ score: number; maxScore: number; passed: boolean }> {
  const { data, ok, status } = await apiFetch<{
    score: number;
    maxScore: number;
    passed: boolean;
  }>(`/api/tests/${encodeURIComponent(id)}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
  if (!ok || !data) throw new Error(`Відправка (${status})`);
  return data;
}
