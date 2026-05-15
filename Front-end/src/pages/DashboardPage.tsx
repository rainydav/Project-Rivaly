import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button, Card, Badge } from '../components/ui';
import { fetchDashboardStatsApi, type DashboardStats } from '../lib/statsApi';
import { searchUsersApi } from '../lib/usersApi';
import { fetchTestsListApi } from '../lib/testsApi';
import { fetchQuizzesListApi } from '../lib/quizzesApi';
import { fetchTournamentsList } from '../lib/tournamentsApi';
import type { UserProfile } from '../types';

export function DashboardPage() {
  const { user } = useApp();
  const [params] = useSearchParams();
  const searchQ = (params.get('search') || '').trim();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recommended, setRecommended] = useState<
    { type: 'test' | 'quiz' | 'tournament'; id: string; title: string; href: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await fetchDashboardStatsApi();
        if (!cancelled) setStats(s);
      } catch (e) {
        if (!cancelled) setStatsErr(e instanceof Error ? e.message : 'Помилка статистики');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchQ.length < 2) {
      setSearchHits([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    (async () => {
      try {
        const rows = await searchUsersApi(searchQ);
        if (!cancelled) setSearchHits(rows);
      } catch {
        if (!cancelled) setSearchHits([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tests, quizzes, tournaments] = await Promise.all([
          fetchTestsListApi(),
          fetchQuizzesListApi(),
          fetchTournamentsList(),
        ]);
        if (cancelled) return;
        const items: { type: 'test' | 'quiz' | 'tournament'; id: string; title: string; href: string }[] =
          [];
        const realTests = tests.filter(
          (t) => t._id !== 'demo' && !/демо/i.test(t.title) && !/^demo$/i.test(t.title)
        );
        for (const t of realTests.slice(0, 2)) {
          items.push({
            type: 'test',
            id: t._id,
            title: t.title,
            href: `/tests/take/${t._id}`,
          });
        }
        const realQuizzes = quizzes.filter(
          (q) => q._id !== 'demo' && !/демо/i.test(q.title) && !/^demo$/i.test(q.title)
        );
        for (const q of realQuizzes.slice(0, 2)) {
          items.push({
            type: 'quiz',
            id: q._id,
            title: q.title,
            href: `/quiz/live/${q._id}`,
          });
        }
        const running = tournaments.filter((tr) =>
          ['REGISTRATION', 'RUNNING'].includes(tr.status)
        );
        for (const tr of running.slice(0, 2)) {
          items.push({
            type: 'tournament',
            id: tr._id,
            title: tr.name,
            href: `/tournaments/play/${tr._id}`,
          });
        }
        setRecommended(items);
      } catch {
        if (!cancelled) setRecommended([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Активні турніри',
          val: String(stats.activeTournaments),
          sub: 'Реєстрація або змагання',
          bg: '!bg-blue-600',
        },
        {
          label: 'Усього турнірів',
          val: String(stats.totalTournaments),
          sub: 'На платформі',
          bg: '!bg-indigo-600',
        },
        {
          label: 'Мої команди',
          val: String(stats.myTeams),
          sub: 'Зареєстровані з вашого акаунту',
          bg: '!bg-purple-600',
        },
        {
          label: 'Учасники',
          val: String(stats.usersCount),
          sub: `Команд у базі: ${stats.teamsCount}`,
          bg: '!bg-emerald-600',
        },
      ]
    : [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tight">
            Вітаємо, {user.name.split(' ')[0]}! 👋
          </h1>
          {statsErr && <p className="text-sm text-red-600 font-bold mt-2">{statsErr}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/tournaments">
            <Button className="px-6 py-3">Турніри</Button>
          </Link>
          <Link to="/tests">
            <Button variant="secondary" className="px-6 py-3">
              Тести
            </Button>
          </Link>
          <Link to="/quizzes">
            <Button variant="secondary" className="px-6 py-3">
              Вікторини
            </Button>
          </Link>
          {(user.role === 'organizer' || user.role === 'admin') && (
            <Link to="/admin/tournament">
              <Button variant="secondary" className="px-6 py-3">
                Студія турнірів
              </Button>
            </Link>
          )}
          <Link to="/leaderboard">
            <Button variant="secondary" className="px-6 py-3">
              Рейтинг
            </Button>
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin-console">
              <Button variant="secondary" className="px-6 py-3">
                Адмін-консоль
              </Button>
            </Link>
          )}
        </div>
      </div>

      {searchQ.length >= 2 && (
        <Card className="p-6">
          <h3 className="text-lg font-black dark:text-white mb-3">
            Результати пошуку: «{searchQ}»
          </h3>
          {searchLoading && <p className="text-slate-500 font-bold">Пошук…</p>}
          {!searchLoading && searchHits.length === 0 && (
            <p className="text-slate-500 font-bold">Нікого не знайдено.</p>
          )}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {searchHits.map((u) => (
              <li key={u.id} className="py-3 flex flex-wrap justify-between gap-2 items-center">
                <Link to={`/users/${u.id}`} className="font-black text-blue-600 hover:underline">
                  {u.name}
                </Link>
                <span className="text-xs text-slate-500 font-mono">{u.email}</span>
                {u.username && (
                  <span className="text-xs font-mono text-slate-400">@{u.username}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {!stats && !statsErr && (
          <p className="text-slate-500 font-bold col-span-full">Завантаження статистики…</p>
        )}
        {statCards.map((s) => (
          <Card
            key={s.label}
            className={`p-8 border-none shadow-xl ${s.bg} text-white`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3">
              {s.label}
            </p>
            <div className="flex items-end justify-between gap-2">
              <h3 className="text-4xl font-black tracking-tight text-white">{s.val}</h3>
              <span className="text-[10px] font-black text-white/90 text-right max-w-[55%] leading-snug">
                {s.sub}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="p-8 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black dark:text-white">Рекомендовано</h3>
            <Badge>Сьогодні</Badge>
          </div>
          <div className="space-y-4">
            {recommended.length === 0 && (
              <p className="text-slate-500 font-bold text-sm">
                Поки немає активного контенту. Перегляньте{' '}
                <Link to="/tests" className="text-blue-600">
                  тести
                </Link>
                ,{' '}
                <Link to="/quizzes" className="text-indigo-600">
                  вікторини
                </Link>{' '}
                або{' '}
                <Link to="/tournaments" className="text-emerald-600">
                  турніри
                </Link>
                .
              </p>
            )}
            {recommended.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.href}
                className={`block p-5 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all ${
                  item.type === 'test'
                    ? 'hover:border-blue-500/40'
                    : item.type === 'quiz'
                      ? 'hover:border-indigo-500/40'
                      : 'hover:border-emerald-500/40'
                }`}
              >
                <p
                  className={`text-xs font-black uppercase ${
                    item.type === 'test'
                      ? 'text-blue-600'
                      : item.type === 'quiz'
                        ? 'text-indigo-600'
                        : 'text-emerald-600'
                  }`}
                >
                  {item.type === 'test' ? 'Тест' : item.type === 'quiz' ? 'Вікторина' : 'Турнір'}
                </p>
                <p className="text-lg font-black dark:text-white mt-1">{item.title}</p>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-8">
          <h3 className="text-xl font-black dark:text-white mb-4">Чат</h3>
          <Link to="/chat">
            <Button className="w-full py-3" variant="indigo">
              Відкрити чат
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
