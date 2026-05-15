import type { ChatMessage } from '../types';
import { apiFetch } from './http';

export async function fetchChatMessagesApi(roomId: string): Promise<ChatMessage[]> {
  const { data, ok, status } = await apiFetch<{ messages: ChatMessage[] }>(
    `/api/chat/messages?room=${encodeURIComponent(roomId)}`,
    { method: 'GET' }
  );
  if (!ok || !data?.messages) throw new Error(`Чат (${status})`);
  return data.messages;
}

export async function postChatMessageApi(
  roomId: string,
  text: string,
  kind: 'text' | 'sticker' = 'text'
): Promise<ChatMessage> {
  const { data, ok, status } = await apiFetch<ChatMessage>('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ roomId, text, kind }),
  });
  if (!ok || !data) throw new Error(`Не надіслано (${status})`);
  return data;
}

export async function deleteChatMessageApi(id: string): Promise<void> {
  const { ok, status } = await apiFetch(`/api/chat/messages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    parseJson: false,
  });
  if (!ok) throw new Error(`Видалення (${status})`);
}
