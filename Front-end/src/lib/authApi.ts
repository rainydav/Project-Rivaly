import type { Gender, UserProfile } from '../types';
import { apiFetch, clearTokens, setTokens } from './http';
import { apiUrl } from '../config/api';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

type MeResponse = { user: UserProfile };

/**
 * Реєстрація: без токенів, лише повідомлення (підтвердження email на бекенді).
 */
export async function registerApi(params: {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  gender: Gender;
}): Promise<{ message: string }> {
  const { data, ok, status } = await apiFetch<{ message?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: params.username,
      email: params.email,
      password: params.password,
      fullName: params.fullName ?? '',
      gender: params.gender,
    }),
  });

  if (!ok || !data?.message) {
    const msg = data?.message || `Помилка реєстрації (${status})`;
    throw new Error(msg);
  }

  return { message: data.message };
}

/** Вхід існуючого користувача; роль береться з облікового запису в БД. */
export async function loginApi(email: string, password: string): Promise<{ user: UserProfile }> {
  const { data, ok, status } = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!ok || !data?.accessToken || !data?.user) {
    const raw = (data as { message?: string })?.message;
    /** Застарілий бекенд повертав 403 з текстом про окремий вхід журі/адміна — цих екранів на фронті вже немає. */
    if (
      typeof raw === 'string' &&
      (raw.includes('використайте вхід') || raw.includes('loginPortal'))
    ) {
      throw new Error(
        'Сервер API ще зі старою логікою входу. Перезапустіть backend після оновлення коду (authRoutes без перевірки loginPortal).'
      );
    }
    const msg = raw || `Помилка входу (${status})`;
    throw new Error(msg);
  }

  setTokens(data.accessToken, data.refreshToken);
  return { user: data.user };
}

export async function forgotPasswordApi(email: string): Promise<void> {
  const { data, ok, status } = await apiFetch<{ message?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!ok) {
    const msg = data?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<void> {
  const { data, ok, status } = await apiFetch<{ message?: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
  if (!ok) {
    const msg = data?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
}

export async function verifyEmailRequest(token: string): Promise<string> {
  const url = apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  const res = await fetch(url, { method: 'GET' });
  return res.text();
}

/** Поточний користувач за збереженим access-токеном */
export async function fetchMe(): Promise<UserProfile | null> {
  const { data, ok } = await apiFetch<MeResponse>('/api/auth/me', { method: 'GET' });
  if (!ok || !data?.user) return null;
  return data.user;
}

/** Вихід: очищаємо токени локально + інвалідуємо refresh на сервері */
export async function logoutApi(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
  } catch {
    /* ігноруємо мережеві помилки — локальні токени все одно прибираємо */
  }
  clearTokens();
}
