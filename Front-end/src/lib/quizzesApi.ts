import type { QuizQuestion } from '../types';
import { apiFetch } from './http';

export type QuizDoc = {
  _id: string;
  title: string;
  competitive: boolean;
  questions: Array<
    QuizQuestion & { timeLimitSec?: number; correctIndex?: number }
  >;
  createdAt?: string;
};

export async function fetchQuizzesListApi(): Promise<QuizDoc[]> {
  const { data, ok } = await apiFetch<QuizDoc[]>('/api/quizzes', { method: 'GET' });
  if (!ok || !Array.isArray(data)) return [];
  return data;
}

export async function fetchQuizByIdApi(id: string): Promise<QuizDoc> {
  const { data, ok, status } = await apiFetch<QuizDoc>(`/api/quizzes/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  if (!ok || !data) throw new Error(`Вікторина (${status})`);
  return data;
}

export async function createQuizApi(body: {
  title: string;
  competitive: boolean;
  questions: QuizDoc['questions'];
}): Promise<QuizDoc> {
  const { data, ok, status } = await apiFetch<QuizDoc>('/api/quizzes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!ok || !data) throw new Error(`Не вдалося створити (${status})`);
  return data;
}

export async function updateQuizApi(
  id: string,
  body: Partial<{ title: string; competitive: boolean; questions: QuizDoc['questions'] }>
): Promise<QuizDoc> {
  const { data, ok, status } = await apiFetch<QuizDoc>(`/api/quizzes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!ok || !data) throw new Error(`Не вдалося зберегти (${status})`);
  return data;
}

export async function deleteQuizApi(id: string): Promise<void> {
  const { ok, status } = await apiFetch(`/api/quizzes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    parseJson: false,
  });
  if (!ok) throw new Error(`Видалення (${status})`);
}

export async function gradeQuizAnswerApi(
  quizId: string,
  questionId: string,
  optionIndex: number
): Promise<{ correct: boolean; basePoints: number; timeLimitSec: number }> {
  const { data, ok, status } = await apiFetch<{
    correct: boolean;
    basePoints: number;
    timeLimitSec: number;
  }>(`/api/quizzes/${encodeURIComponent(quizId)}/grade`, {
    method: 'POST',
    body: JSON.stringify({ questionId, optionIndex }),
  });
  if (!ok || !data) throw new Error(`Перевірка відповіді (${status})`);
  return data;
}

export async function finishQuizSessionApi(
  quizId: string,
  body: { score: number; answers: Record<string, number> }
): Promise<{ quizBestScore: number }> {
  const { data, ok, status } = await apiFetch<{
    ok: boolean;
    score: number;
    quizBestScore: number;
  }>(`/api/quizzes/${encodeURIComponent(quizId)}/finish`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!ok || !data) throw new Error(`Збереження результату (${status})`);
  return { quizBestScore: data.quizBestScore };
}
