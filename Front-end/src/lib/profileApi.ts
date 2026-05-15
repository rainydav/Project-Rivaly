import type { UserProfile } from '../types';
import { apiFetch } from './http';

/**
 * Оновлення профілю на сервері (PATCH) + повернення актуального обʼєкта user.
 */
export async function patchProfileApi(patch: Partial<UserProfile>): Promise<UserProfile> {
  const body: Record<string, string> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.bio !== undefined) body.bio = patch.bio;
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.avatarUrl !== undefined) body.avatarUrl = patch.avatarUrl;
  if (patch.gender !== undefined) body.gender = patch.gender;
  if (patch.username !== undefined) body.username = patch.username;

  const { data, ok, status } = await apiFetch<{ user: UserProfile }>('/api/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  if (!ok || !data?.user) {
    const msg = (data as { message?: string })?.message || `Помилка збереження (${status})`;
    throw new Error(msg);
  }
  return data.user;
}

export async function completeCourseApi(courseId: string): Promise<UserProfile> {
  const { data, ok, status } = await apiFetch<{ user: UserProfile }>(
    '/api/profile/me/complete-course',
    {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    }
  );
  if (!ok || !data?.user) {
    const msg = (data as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data.user;
}
