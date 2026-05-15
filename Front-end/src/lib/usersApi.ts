import { apiFetch } from './http';
import type { UserProfile, UserRole } from '../types';

export async function searchUsersApi(q: string): Promise<UserProfile[]> {
  const qq = q.trim();
  if (qq.length < 2) return [];
  const { data, ok } = await apiFetch<UserProfile[]>(
    `/api/users/search?q=${encodeURIComponent(qq)}`,
    { method: 'GET' }
  );
  if (!ok || !Array.isArray(data)) return [];
  return data;
}

export async function fetchAllUsersApi(): Promise<UserProfile[]> {
  const { data, ok, status } = await apiFetch<UserProfile[]>('/api/users/all', { method: 'GET' });
  if (!ok || !Array.isArray(data)) {
    const body = data as unknown as { message?: string; actualRole?: string };
    if (status === 403) {
      throw new Error(
        body?.message === 'Access denied'
          ? 'Доступ заборонено. Увійдіть як адміністратор або оновіть сесію (вийдіть і увійдіть знову).'
          : `Доступ заборонено (${status})`
      );
    }
    throw new Error(body?.message || `Не вдалося завантажити користувачів (${status})`);
  }
  return data;
}

export async function fetchUserByIdApi(id: string): Promise<UserProfile> {
  const { data, ok, status } = await apiFetch<{ user: UserProfile }>(
    `/api/users/${encodeURIComponent(id)}`,
    { method: 'GET' }
  );
  if (!ok || !data?.user) {
    throw new Error(`Користувача не знайдено (${status})`);
  }
  return data.user;
}

export async function updateUserRoleApi(id: string, role: UserRole): Promise<UserProfile> {
  const { data, ok, status } = await apiFetch<{ user: UserProfile }>(
    `/api/users/role/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }
  );
  if (!ok || !data?.user) {
    const msg = (data as unknown as { message?: string })?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
  return data.user;
}

export async function deleteUserApi(id: string): Promise<void> {
  const { ok, status } = await apiFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    parseJson: false,
  });
  if (!ok) throw new Error(`Не вдалося видалити (${status})`);
}
