import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Flame, Heart } from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';
import { fetchTournamentsList, type TournamentDoc } from '../lib/tournamentsApi';

function daysLeft(iso?: string) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
}

/**
 * Список турнірів з API; картка веде на сторінку турніру з таймером.
 */
export function TournamentsPage() {
  const [items, setItems] = useState<TournamentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const searchQ = (params.get('search') || '').trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTournamentsList();
        if (!cancelled) setItems(list);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!searchQ) return items;
    return items.filter((t) => t.name.toLowerCase().includes(searchQ));
  }, [items, searchQ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter">
            Турніри
          </h1>
          {loading && <p className="text-sm text-slate-500 mt-2 font-bold">Оновлення…</p>}
        </div>
        <Button variant="secondary" className="px-5 py-3">
          <Filter size={18} /> Фільтри
        </Button>
      </div>
      <div className="space-y-6">
        {items.length === 0 && !loading && (
          <p className="text-slate-500 font-bold">Поки немає турнірів на сервері.</p>
        )}
        {searchQ && filtered.length === 0 && items.length > 0 && (
          <p className="text-slate-500 font-bold">Нічого не знайдено за запитом «{searchQ}».</p>
        )}
        {filtered.map((t) => {
          const end =
            t.status === 'REGISTRATION'
              ? t.registrationEnd
              : t.status === 'RUNNING'
                ? t.startDate || t.registrationEnd
                : t.registrationEnd;
          const days = daysLeft(end);
          return (
            <Card
              key={t._id}
              className="p-8 flex flex-col md:flex-row gap-8 hover:shadow-2xl transition-all group border-none bg-white dark:bg-slate-900/60 backdrop-blur"
            >
              <div className="w-full md:w-64 h-52 rounded-[40px] overflow-hidden shadow-lg relative">
                <img
                  src={`https://picsum.photos/seed/${String(t._id).slice(-3)}/600/400`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt=""
                />
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-2xl text-[10px] font-black uppercase">
                  {t.status}
                </div>
              </div>
              <div className="flex-1 py-1 flex flex-col justify-between gap-6">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link to={`/tournaments/${t._id}`}>
                      <h3 className="text-2xl md:text-3xl font-black dark:text-white group-hover:text-blue-600 transition-colors">
                        {t.name}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge>{t.status}</Badge>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-3 h-fit bg-slate-50 dark:bg-slate-800 rounded-2xl text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Heart size={20} />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-50 dark:border-slate-800">
                  <span className="text-sm font-bold text-orange-500 flex items-center gap-2">
                    <Flame size={16} />
                    {days === null
                      ? '—'
                      : days === 0
                        ? 'Етап завершується або завершено'
                        : `~${days} дн. до орієнтиру етапу`}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <Link to={`/chat?room=${t._id}`}>
                      <Button variant="secondary" className="px-5 py-3">
                        Чат турніру
                      </Button>
                    </Link>
                    <Link to={`/tournaments/${t._id}`}>
                      <Button variant="secondary" className="px-5 py-3">
                        Деталі
                      </Button>
                    </Link>
                    <Link to={`/tournaments/play/${t._id}`}>
                      <Button className="px-8 py-3 rounded-[22px]">Арена</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
