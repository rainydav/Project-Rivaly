import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchUserByIdApi } from '../lib/usersApi';
import type { UserProfile } from '../types';
import { roleLabel, useApp } from '../context/AppContext';
import { Card } from '../components/ui';

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const u = await fetchUserByIdApi(id);
        if (!cancelled) setProfile(u);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Помилка');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (err) {
    return <p className="p-8 text-red-600 font-bold">{err}</p>;
  }
  if (!profile) {
    return <p className="p-8 text-slate-500 font-bold">Завантаження…</p>;
  }

  const isSelf = me.id === profile.id;
  const showEmail = isSelf || me.role === 'admin';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link to="/dashboard" className="text-sm font-bold text-blue-600 hover:underline">
        ← Назад
      </Link>
      <Card className="p-8 text-center">
        <img
          src={profile.avatarUrl || 'https://i.pravatar.cc/200'}
          alt=""
          className="w-32 h-32 rounded-[32px] object-cover mx-auto mb-4"
        />
        <h1 className="text-3xl font-black dark:text-white">{profile.name}</h1>
        <p className="text-slate-500 font-bold mt-1">{profile.title}</p>
        <p className="text-sm text-slate-400 mt-2">{roleLabel(profile.role)}</p>
        {profile.username && (
          <p className="text-sm text-slate-500 mt-1 font-mono">@{profile.username}</p>
        )}
        {showEmail && (
          <p className="text-xs text-slate-500 mt-3 font-bold">
            Email: <span className="font-mono">{profile.email}</span>
          </p>
        )}
        {profile.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <div>
              <p className="text-xl font-black dark:text-white">{profile.stats.tournamentsJoined}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Турніри</p>
            </div>
            <div>
              <p className="text-xl font-black dark:text-white">{profile.stats.testsTaken}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Тестів</p>
              <p className="text-[10px] text-slate-400">{profile.stats.testPassPercent}%</p>
            </div>
            <div>
              <p className="text-xl font-black dark:text-white">{profile.stats.quizSessionsFinished}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Вікторин</p>
              <p className="text-[10px] text-slate-400">{profile.stats.quizBestScore} б.</p>
            </div>
            <div>
              <p className="text-xl font-black dark:text-white">{profile.stats.coursesCompleted}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Курси</p>
            </div>
          </div>
        )}
        <p className="mt-6 text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">
          {profile.bio || '—'}
        </p>
      </Card>
    </div>
  );
}
