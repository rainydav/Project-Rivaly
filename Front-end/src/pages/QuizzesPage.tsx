import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Timer } from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';
import { fetchQuizzesListApi, type QuizDoc } from '../lib/quizzesApi';

export function QuizzesPage() {
  const [items, setItems] = useState<QuizDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const searchQ = (params.get('search') || '').trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchQuizzesListApi();
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setItems([]);
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
    return items.filter((q) => q.title.toLowerCase().includes(searchQ));
  }, [items, searchQ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tight">Вікторини</h1>
        <p className="text-slate-500 font-bold mt-2">Змагальні вікторини з сервера.</p>
        {loading && <p className="text-sm text-slate-500 mt-2 font-bold">Завантаження…</p>}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((q) => (
          <Card
            key={q._id}
            className="p-8 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-black dark:text-white">{q.title}</h3>
              {q.competitive ? (
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Timer size={14} /> змагальний
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">Питань: {q.questions?.length ?? 0}</p>
            <Link to={`/quiz/live/${q._id}`} className="mt-auto">
              <Button className="w-full py-3" variant="indigo">
                Розпочати
              </Button>
            </Link>
          </Card>
        ))}
      </div>
      {searchQ && filtered.length === 0 && !loading && (
        <p className="text-slate-500 font-bold">Нічого не знайдено за запитом «{searchQ}».</p>
      )}
      {items.length === 0 && !loading && (
        <p className="text-slate-500 font-bold">
          Поки немає вікторин у базі. Організатор або адмін може створити їх у конструкторі.
        </p>
      )}
    </div>
  );
}
