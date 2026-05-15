import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/ui';
import { fetchTournamentsList, type TournamentDoc } from '../lib/tournamentsApi';
import { deleteChatMessageApi, fetchChatMessagesApi, postChatMessageApi } from '../lib/chatApi';
import type { ChatMessage } from '../types';

type Room = { id: string; label: string };

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function containsBanned(text: string, words: string[]) {
  const t = normalize(text);
  return words.some((w) => w && t.includes(normalize(w)));
}

export function ChatPage() {
  const { user, pushToast, moderation, bans, setBans } = useApp();
  const [params] = useSearchParams();
  const roomFromQuery = params.get('room');
  const [room, setRoom] = useState(roomFromQuery || 'global');
  const [text, setText] = useState('');
  const [tournaments, setTournaments] = useState<TournamentDoc[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchChatMessagesApi(room);
      setMessages(list);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Не вдалося завантажити чат');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [room, pushToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTournamentsList();
        if (!cancelled) setTournaments(list);
      } catch {
        if (!cancelled) setTournaments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const r = params.get('room');
    if (r) setRoom(r);
  }, [params]);

  useEffect(() => {
    void reloadMessages();
  }, [reloadMessages]);

  const rooms: Room[] = useMemo(() => {
    const list: Room[] = [{ id: 'global', label: 'Загальний чат' }];
    for (const t of tournaments) {
      list.push({ id: t._id, label: `Турнір: ${t.name}` });
    }
    return list;
  }, [tournaments]);

  const filtered = messages.filter((m) => m.roomId === room);
  const showBanTest = user.role === 'admin';
  const isAdmin = user.role === 'admin';

  const trySend = async (body: string, kind: 'text' | 'sticker') => {
    const until = bans[user.id];
    if (until && until > Date.now()) {
      const sec = Math.ceil((until - Date.now()) / 1000);
      pushToast(`Обмеження чату: зачекайте ${sec} с.`);
      return;
    }
    const trimmed = body.trim();
    if (!trimmed) return;

    if (kind === 'sticker') {
      if (moderation.stickerTriggers.some((s) => trimmed.includes(s))) {
        setBans((b) => ({
          ...b,
          [user.id]: Date.now() + moderation.banMinutes * 60_000,
        }));
        pushToast(`Стікер заблоковано. Бан на ${moderation.banMinutes} хв.`);
        return;
      }
    }

    if (containsBanned(trimmed, moderation.bannedWords)) {
      setBans((b) => ({
        ...b,
        [user.id]: Date.now() + moderation.banMinutes * 60_000,
      }));
      pushToast(`Повідомлення містить заборонені слова. Бан на ${moderation.banMinutes} хв.`);
      return;
    }

    try {
      await postChatMessageApi(room, trimmed, kind);
      await reloadMessages();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Не надіслано');
    }
  };

  return (
    <div className="grid lg:grid-cols-[260px,1fr] gap-8 min-h-[70vh]">
      <Card className="p-5 h-fit lg:sticky lg:top-6">
        <p className="text-xs font-black uppercase text-slate-500 mb-3">Кімнати</p>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoom(r.id)}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                room === r.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-0 flex flex-col min-h-[520px]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Чат</p>
            <p className="text-lg font-black dark:text-white">
              {rooms.find((r) => r.id === room)?.label ?? 'Чат'}
            </p>
          </div>
          <div className="flex gap-2">
            {showBanTest && (
              <Button
                variant="danger"
                className="px-3 py-2 text-xs"
                type="button"
                onClick={() => void trySend(':banned: тест', 'sticker')}
              >
                Тест бану
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && <p className="text-sm text-slate-500 font-bold">Завантаження…</p>}
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${
                m.userId === user.id
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="flex justify-between gap-2 items-start">
                <p className="text-[10px] font-black uppercase opacity-70 mb-1 flex-1">
                  {m.userId && m.userId !== 'sys' ? (
                    <Link to={`/users/${m.userId}`} className="underline-offset-2 hover:underline">
                      {m.userName}
                    </Link>
                  ) : (
                    m.userName
                  )}{' '}
                  · {m.kind}
                </p>
                {isAdmin && m.id !== 'sys-welcome' && (
                  <button
                    type="button"
                    className="text-[10px] font-black text-red-500 shrink-0"
                    onClick={async () => {
                      if (!confirm('Видалити повідомлення?')) return;
                      try {
                        await deleteChatMessageApi(m.id);
                        pushToast('Видалено');
                        void reloadMessages();
                      } catch (e) {
                        pushToast(e instanceof Error ? e.message : 'Помилка');
                      }
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="font-medium">{m.text}</p>
            </div>
          ))}
        </div>
        <form
          className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void trySend(text, 'text');
            setText('');
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Повідомлення..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 outline-none dark:text-white"
          />
          <Button type="submit" className="px-6 py-3">
            Надіслати
          </Button>
        </form>
      </Card>
    </div>
  );
}
