import { apiFetch } from './http';

export async function sendSupportMessageApi(message: string): Promise<void> {
  const { data, ok, status } = await apiFetch<{ message?: string }>('/api/support/contact', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  if (!ok) {
    const msg = data?.message || `Помилка (${status})`;
    throw new Error(msg);
  }
}
