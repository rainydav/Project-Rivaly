import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card, Badge } from '../components/ui';
import {
  fetchTournamentBundle,
  type RoundDoc,
  type TeamDoc,
  type TournamentDoc,
} from '../lib/tournamentsApi';
import {
  closeRoundSubmissionsApi,
  fetchMySubmissionApi,
  upsertSubmissionApi,
  type SubmissionDoc,
} from '../lib/submissionsApi';

function formatUk(iso: string) {
  try {
    return new Date(iso).toLocaleString('uk-UA');
  } catch {
    return iso;
  }
}

function pickActiveRound(rounds: RoundDoc[]): RoundDoc | null {
  const now = Date.now();
  const active = rounds.find((r) => {
    if (r.status !== 'ACTIVE') return false;
    const start = new Date(r.startsAt).getTime();
    const end = new Date(r.deadline).getTime();
    return now >= start && now <= end;
  });
  if (active) return active;
  return rounds.find((r) => r.status === 'ACTIVE') || null;
}

export function TournamentPlayPage() {
  const { id } = useParams<{ id: string }>();
  const { user, pushToast } = useApp();

  const [tournament, setTournament] = useState<TournamentDoc | null>(null);
  const [rounds, setRounds] = useState<RoundDoc[]>([]);
  const [myTeam, setMyTeam] = useState<TeamDoc | null>(null);
  const [activeRound, setActiveRound] = useState<RoundDoc | null>(null);
  const [submission, setSubmission] = useState<SubmissionDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = user.role === 'admin' || user.role === 'organizer';
  const isJury = user.role === 'jury';

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const bundle = await fetchTournamentBundle(id);
      setTournament(bundle.tournament);
      setRounds(bundle.rounds);
      const team = bundle.teams.find((t) => String(t.owner) === String(user.id)) || null;
      setMyTeam(team);
      const round = pickActiveRound(bundle.rounds);
      setActiveRound(round);
      if (round) {
        const sub = await fetchMySubmissionApi(round._id);
        setSubmission(sub);
        if (sub) {
          setGithubUrl(sub.githubUrl || '');
          setDemoUrl(sub.demoUrl || '');
          setLiveDemoUrl(sub.liveDemoUrl || '');
          setDescription(sub.description || '');
        }
      } else {
        setSubmission(null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [id, user.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submissionOpen = useMemo(() => {
    if (!activeRound) return false;
    const now = Date.now();
    return (
      activeRound.status === 'ACTIVE' &&
      now >= new Date(activeRound.startsAt).getTime() &&
      now <= new Date(activeRound.deadline).getTime()
    );
  }, [activeRound]);

  const locked = !!submission?.lockedAt;

  if (!id) return null;

  if (loading) {
    return <p className="p-10 text-slate-500 font-bold">Завантаження…</p>;
  }

  if (err || !tournament) {
    return (
      <motionDiv>
        <p className="text-red-600 font-bold">{err || 'Турнір не знайдено'}</p>
        <Link to="/tournaments" className="text-blue-600 font-bold mt-4 inline-block">
          До списку турнірів
        </Link>
      </motionDiv>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to={`/tournaments/${id}`} className="text-sm font-bold text-blue-600 hover:underline">
          ← {tournament.name}
        </Link>
        <h1 className="text-3xl font-black dark:text-white mt-2">Здача роботи</h1>
        <p className="text-sm text-slate-500 font-bold mt-1">
          Подання зберігається на сервері та потрапляє до журі після закриття прийому.
        </p>
      </div>

      {isJury && (
        <Card className="p-6 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900">
          <p className="font-black dark:text-white">Ви в ролі журі</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Переглядайте призначені роботи та виставляйте бали за критеріями турніру.
          </p>
          <Link to="/jury" className="inline-block mt-4">
            <Button variant="indigo">Перейти до оцінювання</Button>
          </Link>
        </Card>
      )}

      {!myTeam && !canManage && !isJury && (
        <Card className="p-6">
          <p className="font-bold text-slate-600 dark:text-slate-300">
            Щоб здати роботу, створіть команду на сторінці турніру під час реєстрації.
          </p>
          <Link to={`/tournaments/${id}`} className="inline-block mt-4">
            <Button>Сторінка турніру</Button>
          </Link>
        </Card>
      )}

      {rounds.length === 0 && (
        <Card className="p-6 space-y-3">
          <p className="font-bold text-slate-600 dark:text-slate-300">
            У турніру ще немає раундів здачі. Організатор або адміністратор має створити раунд у конструкторі.
          </p>
          {(user.role === 'admin' || user.role === 'organizer') && (
            <Link to={`/admin/tournament?tournament=${id}`}>
              <Button variant="secondary" className="text-sm">
                Створити раунд у конструкторі
              </Button>
            </Link>
          )}
        </Card>
      )}

      {rounds.length > 0 && !activeRound && (
        <Card className="p-6">
          <p className="font-bold text-slate-600 dark:text-slate-300">
            Зараз немає активного вікна подання.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {rounds.map((r) => (
              <li key={r._id} className="flex flex-wrap gap-2 items-center">
                <span className="font-black dark:text-white">{r.title}</span>
                <Badge>{r.status}</Badge>
                <span className="text-slate-500">до {formatUk(r.deadline)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {activeRound && (
        <Card className="p-6 space-y-5">
          <motionDiv className="flex flex-wrap justify-between gap-3 items-start">
            <div>
              <h2 className="text-xl font-black dark:text-white">{activeRound.title}</h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock size={14} /> Дедлайн: {formatUk(activeRound.deadline)}
              </p>
            </div>
            <Badge variant={submissionOpen && !locked ? 'emerald' : 'orange'}>
              {locked ? 'Закрито' : submissionOpen ? 'Прийом відкрито' : 'Очікування'}
            </Badge>
          </motionDiv>

          {myTeam && (
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Команда: <span className="dark:text-white">{myTeam.name}</span>
            </p>
          )}

          {myTeam && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!activeRound) return;
                if (!githubUrl.trim() || !demoUrl.trim()) {
                  pushToast('Потрібні посилання GitHub і демо');
                  return;
                }
                setSaving(true);
                try {
                  const saved = await upsertSubmissionApi(activeRound._id, {
                    githubUrl: githubUrl.trim(),
                    demoUrl: demoUrl.trim(),
                    liveDemoUrl: liveDemoUrl.trim(),
                    description: description.trim(),
                  });
                  setSubmission(saved);
                  pushToast('Роботу збережено');
                } catch (ex) {
                  pushToast(ex instanceof Error ? ex.message : 'Помилка здачі');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Field
                label="GitHub / репозиторій *"
                value={githubUrl}
                onChange={setGithubUrl}
                placeholder="https://github.com/org/project"
                disabled={!submissionOpen || locked}
              />
              <Field
                label="Демо (URL) *"
                value={demoUrl}
                onChange={setDemoUrl}
                placeholder="https://..."
                disabled={!submissionOpen || locked}
              />
              <Field
                label="Live demo (опційно)"
                value={liveDemoUrl}
                onChange={setLiveDemoUrl}
                placeholder="https://..."
                disabled={!submissionOpen || locked}
              />
              <label className="block text-xs font-black uppercase text-slate-500">
                Опис / примітки
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={!submissionOpen || locked}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold disabled:opacity-60"
                />
              </label>

              {submission?.submittedAt && (
                <p className="text-xs text-emerald-600 font-bold">
                  Остання здача: {formatUk(submission.submittedAt)}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!submissionOpen || locked || saving}>
                  {saving ? 'Збереження…' : submission ? 'Оновити подання' : 'Здати роботу'}
                </Button>
                {submission?.githubUrl && (
                  <a
                    href={submission.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 self-center"
                  >
                    <ExternalLink size={16} /> GitHub
                  </a>
                )}
              </div>
            </form>
          )}

          {canManage && activeRound.status === 'ACTIVE' && (
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                if (!confirm('Закрити прийом подань у цьому раунді?')) return;
                try {
                  await closeRoundSubmissionsApi(activeRound._id);
                  pushToast('Прийом закрито. Можна розподілити роботи журі.');
                  void reload();
                } catch (ex) {
                  pushToast(ex instanceof Error ? ex.message : 'Помилка');
                }
              }}
            >
              Закрити прийом подань
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

function motionDiv({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-xs font-black uppercase text-slate-500">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold font-mono text-sm disabled:opacity-60"
      />
    </label>
  );
}
