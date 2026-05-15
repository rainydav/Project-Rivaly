/**
 * Базова URL API.
 * - Якщо задано VITE_API_URL (напр. http://localhost:5000) — запити йдуть напряму (потрібен CORS на бекенді).
 * - Якщо порожньо — використовуються відносні шляхи /api/... (через proxy у vite.config).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  const base = (raw || '').replace(/\/$/, '');

  if (!base || typeof window === 'undefined') {
    return base;
  }

  try {
    const apiUrl = new URL(base);
    const pageHost = window.location.hostname;
    const apiIsLocalhost = apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1';
    const pageIsLocalhost = pageHost === 'localhost' || pageHost === '127.0.0.1';

    if (apiIsLocalhost && !pageIsLocalhost) {
      return '';
    }
  } catch {
    return base;
  }

  return base;
}

/** Повний URL для шляху API (наприклад /api/..., /api/tournaments/...). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!path.startsWith('/')) {
    return `${base}/${path}`;
  }
  return base ? `${base}${path}` : path;
}
