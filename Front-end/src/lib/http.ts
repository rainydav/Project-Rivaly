import { apiUrl } from '../config/api';

const ACCESS_KEY = 'rivaly_access_token';
const REFRESH_KEY = 'rivaly_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export type ApiErrorBody = { message?: string };

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!res.ok) return null;
        const body = (await res.json()) as {
          accessToken?: string;
          user?: import('../types').UserProfile;
        };
        if (!body.accessToken) return null;
        localStorage.setItem(ACCESS_KEY, body.accessToken);
        if (body.user) {
          window.dispatchEvent(new CustomEvent('rivaly:user-refreshed', { detail: body.user }));
        }
        return body.accessToken;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

/**
 * Обгортка над fetch: JSON, Authorization, базовий URL, авто-refresh при 401.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { parseJson?: boolean } = {}
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const url = apiUrl(path);
  const headers = new Headers(init.headers);

  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const doFetch = () => fetch(url, { ...init, headers });

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    const hint =
      url.startsWith('http://') || url.startsWith('https://')
        ? `Сервер не відповідає (${url}). Запустіть бекенд і перевірте VITE_API_URL у Front-end/.env.`
        : `Запит ${url} не виконався. Запустіть фронт (npm run dev) і бекенд на порту 5000, або задайте VITE_API_URL.`;
    throw new Error(hint);
  }

  if (res.status === 401 && getRefreshToken()) {
    const next = await refreshAccessToken();
    if (next) {
      headers.set('Authorization', `Bearer ${next}`);
      res = await doFetch();
    }
  }

  const parseJson = init.parseJson !== false;
  let data: T | null = null;
  const ct = res.headers.get('content-type');
  if (parseJson && ct && ct.includes('application/json')) {
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }
  }
  return { ok: res.ok, status: res.status, data };
}
