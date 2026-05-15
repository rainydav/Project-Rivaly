import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, Timer } from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';
import { fetchTestsListApi, type TestDoc } from '../lib/testsApi';

export function TestsPage() {
  const [items, setItems] = useState<TestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const searchQ = (params.get('search') || '').trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTestsListApi();
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
    return items.filter((t) => t.title.toLowerCase().includes(searchQ));
  }, [items, searchQ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tight">Тести</h1>
        <p className="text-slate-500 font-bold mt-2">Каталог тестів з сервера.</p>
        {loading && <p className="text-sm text-slate-500 mt-2 font-bold">Завантаження…</p>}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((t) => (
          <Card
            key={t._id}
            className="p-8 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-black dark:text-white">{t.title}</h3>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Timer size={14} /> {t.timerMinutes} хв
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Питань: {t.questions?.length ?? 0}
            </p>
            <Link to={`/tests/take/${t._id}`} className="mt-auto">
              <Button className="w-full py-3">Пройти</Button>
            </Link>
          </Card>
        ))}
      </div>
      {items.length === 0 && !loading && (
        <p className="text-slate-500 font-bold">
          Поки немає тестів у базі. Організатор або адмін може створити їх у конструкторі.
        </p>
      )}
      {searchQ && filtered.length === 0 && items.length > 0 && (
        <p className="text-slate-500 font-bold">Нічого не знайдено за запитом «{searchQ}».</p>
      )}
    </div>
  );
}
