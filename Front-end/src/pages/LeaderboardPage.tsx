import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from '../components/ui';
import { fetchLeaderboardApi, type LeaderboardRow } from '../lib/statsApi';

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchLeaderboardApi();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Помилка');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black dark:text-white">Рейтинг</h1>
        <p className="text-slate-500 mt-2 font-bold">
          Загальний рейтинг окремо враховує бали тестів і вікторин (не змішує їх у колонці «Тести»).
        </p>
      </div>
      {err && <p className="text-red-600 font-bold">{err}</p>}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Учасник</th>
              <th className="p-4">Усього</th>
              <th className="p-4">Тести (бали)</th>
              <th className="p-4">Вікторина (бали)</th>
              <th className="p-4">Тести %</th>
              <th className="p-4">Сесії вікторин</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-4 font-mono text-slate-500">{r.rank}</td>
                <td className="p-4">
                  <Link
                    to={`/users/${r.user.id}`}
                    className="flex items-center gap-3 font-black dark:text-white hover:text-blue-600"
                  >
                    <img
                      src={r.user.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <span>
                      {r.user.name}
                      {r.user.username ? (
                        <span className="block text-xs font-mono text-slate-500">@{r.user.username}</span>
                      ) : null}
                    </span>
                  </Link>
                </td>
                <td className="p-4 font-mono font-black">{r.score}</td>
                <td className="p-4 font-mono">{r.testScore ?? (r.testsPassed || 0) * 20}</td>
                <td className="p-4 font-mono">{r.quizScore ?? r.quizBestScore}</td>
                <td className="p-4">
                  <Badge variant="slate">
                    {r.testsTaken > 0 ? `${r.testPassPercent}%` : '—'}
                  </Badge>
                </td>
                <td className="p-4 text-xs font-mono">{r.quizSessionsFinished}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
