import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { UserProfile } from '../types';
import { useApp } from '../context/AppContext';
import { Button, Card, Badge } from '../components/ui';
import {
  fetchTournamentBundle,
  updateTournamentApi,
  deleteTournamentApi,
  type TournamentDoc,
  type TeamDoc,
  type RoundDoc,
  type EvaluationCriterion,
} from '../lib/tournamentsApi';
import { assignJuryToRoundApi } from '../lib/evaluationsApi';
import {
  createTeamApi,
  addTeamMemberApi,
  removeTeamMemberApi,
  updateTeamNameApi,
  deleteTeamApi,
} from '../lib/teamsApi';

const STATUS_OPTIONS: TournamentDoc['status'][] = [
  'DRAFT',
  'REGISTRATION',
  'RUNNING',
  'FINISHED',
];

function formatUk(iso: string) {
  try {
    return new Date(iso).toLocaleString('uk-UA');
  } catch {
    return iso;
  }
}

function useTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

function countdownTo(iso: string | undefined) {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  const ms = end - Date.now();
  if (ms <= 0) return 'час вийшов';
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return `${d}д ${h}г ${m}хв ${s}с`;
}

const DEFAULT_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  { key: 'backendCodeQuality', label: 'Якість backend-коду' },
  { key: 'database', label: 'База даних' },
  { key: 'frontendCodeQuality', label: 'Якість frontend' },
  { key: 'mustHaveCompletion', label: 'Must-have / повнота' },
  { key: 'reliability', label: 'Надійність' },
  { key: 'usability', label: 'Зручність (UX)' },
];

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, pushToast } = useApp();
  useTick();

  const [tournament, setTournament] = useState<TournamentDoc | null>(null);
  const [teams, setTeams] = useState<TeamDoc[]>([]);
  const [rounds, setRounds] = useState<RoundDoc[]>([]);
  const [criteriaDraft, setCriteriaDraft] = useState<EvaluationCriterion[]>(DEFAULT_EVALUATION_CRITERIA);
  const [inspectTeam, setInspectTeam] = useState<TeamDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const canEditTournament = user.role === 'admin' || user.role === 'organizer';
  const isAdmin = user.role === 'admin';
  const isParticipant = user.role === 'participant';

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const b = await fetchTournamentBundle(id);
      setTournament(b.tournament);
      setTeams(b.teams);
      setRounds(b.rounds);
      setCriteriaDraft(
        b.tournament.evaluationCriteria && b.tournament.evaluationCriteria.length > 0
          ? b.tournament.evaluationCriteria
          : DEFAULT_EVALUATION_CRITERIA
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const myTeam = useMemo(
    () => teams.find((t) => String(t.owner) === String(user.id)),
    [teams, user.id]
  );

  const deadlineLabel = useMemo(() => {
    if (!tournament) return null;
    if (tournament.status === 'REGISTRATION') {
      return { title: 'До кінця реєстрації', iso: tournament.registrationEnd };
    }
    if (tournament.status === 'RUNNING') {
      return { title: 'Відлік (орієнтир)', iso: tournament.startDate || tournament.registrationEnd };
    }
    return null;
  }, [tournament]);

  if (!id) return null;

  if (loading && !tournament) {
    return (
      <div className="p-10 text-slate-500 font-bold">Завантаження турніру…</div>
    );
  }

  if (err || !tournament) {
    return (
      <div className="p-10">
        <p className="text-red-600 font-bold">{err || 'Не знайдено'}</p>
        <Link to="/tournaments" className="text-blue-600 font-bold mt-4 inline-block">
          До списку
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link to="/tournaments" className="text-sm font-bold text-blue-600 hover:underline">
            ← Усі турніри
          </Link>
          <h1 className="text-4xl font-black dark:text-white mt-2">{tournament.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge>{tournament.status}</Badge>
            {deadlineLabel && (
              <Badge variant="orange">
                {deadlineLabel.title}: {countdownTo(deadlineLabel.iso)}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Реєстрація: {formatUk(tournament.registrationStart)} — {formatUk(tournament.registrationEnd)}
          </p>
          {(tournament.description || tournament.requirements || tournament.rules) && (
            <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {tournament.description ? (
                <div>
                  <p className="text-xs font-black uppercase text-slate-500 mb-1">Опис</p>
                  <p className="whitespace-pre-wrap">{tournament.description}</p>
                </div>
              ) : null}
              {tournament.requirements ? (
                <div>
                  <p className="text-xs font-black uppercase text-slate-500 mb-1">Вимоги</p>
                  <p className="whitespace-pre-wrap">{tournament.requirements}</p>
                </div>
              ) : null}
              {tournament.rules ? (
                <div>
                  <p className="text-xs font-black uppercase text-slate-500 mb-1">Правила</p>
                  <p className="whitespace-pre-wrap">{tournament.rules}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
        <Link to={`/tournaments/play/${id}`}>
          <Button className="rounded-2xl px-6">Здати роботу</Button>
        </Link>
      </div>

      {isAdmin && (
        <Card className="p-6 border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
          <h2 className="text-lg font-black dark:text-white">Адміністратор</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Видалення турніру безповоротно прибирає команди, раунди, подання та оцінки.
          </p>
          <Button
            type="button"
            variant="danger"
            className="mt-4"
            onClick={async () => {
              if (!id || !confirm('Остаточно видалити турнір і всі повʼязані дані?')) return;
              try {
                await deleteTournamentApi(id);
                pushToast('Турнір видалено');
                navigate('/tournaments');
              } catch (ex) {
                pushToast(ex instanceof Error ? ex.message : 'Помилка');
              }
            }}
          >
            Видалити турнір
          </Button>
        </Card>
      )}

      {canEditTournament && (
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-black dark:text-white">Критерії оцінювання для журі</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ключ (латиниця, цифри, _) зберігається в оцінках. Підпис показується журі. Мінімум один критерій.
          </p>
          <ul className="space-y-3">
            {criteriaDraft.map((row, idx) => (
              <li key={idx} className="grid sm:grid-cols-[1fr,2fr,auto] gap-2 items-end">
                <label className="text-xs font-black uppercase text-slate-500">
                  Ключ
                  <input
                    value={row.key}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                      setCriteriaDraft((rows) => rows.map((r, i) => (i === idx ? { ...r, key: v } : r)));
                    }}
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold font-mono text-sm"
                  />
                </label>
                <label className="text-xs font-black uppercase text-slate-500">
                  Підпис
                  <input
                    value={row.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCriteriaDraft((rows) => rows.map((r, i) => (i === idx ? { ...r, label: v } : r)));
                    }}
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold"
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => setCriteriaDraft((rows) => rows.filter((_, i) => i !== idx))}
                >
                  Прибрати
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCriteriaDraft((rows) => [...rows, { key: '', label: '' }])}
            >
              + Критерій
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!id) return;
                const cleaned = criteriaDraft.filter((c) => c.key.trim() && c.label.trim());
                if (!cleaned.length) {
                  pushToast('Додайте хоча б один критерій з ключем і підписом');
                  return;
                }
                try {
                  const updated = await updateTournamentApi(id, { evaluationCriteria: cleaned });
                  setTournament(updated);
                  pushToast('Критерії збережено');
                  void reload();
                } catch (ex) {
                  pushToast(ex instanceof Error ? ex.message : 'Помилка');
                }
              }}
            >
              Зберегти критерії
            </Button>
          </div>
        </Card>
      )}

      {canEditTournament && rounds.length === 0 && (
        <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40">
          <p className="font-bold text-slate-700 dark:text-slate-200">
            Щоб учасники могли здати роботу, створіть раунд із вікном подання.
          </p>
          <Link to={`/admin/tournament?tournament=${id}`} className="inline-block mt-3">
            <Button variant="secondary" className="text-sm">
              Створити раунд у конструкторі
            </Button>
          </Link>
        </Card>
      )}

      {rounds.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap justify-between gap-3 items-center">
            <h2 className="text-xl font-black dark:text-white">Раунди</h2>
            {canEditTournament && (
              <Link to={`/admin/tournament?tournament=${id}`}>
                <Button variant="secondary" className="text-xs">
                  + Додати раунд
                </Button>
              </Link>
            )}
          </div>
          <ul className="space-y-3 text-sm">
            {rounds.map((r) => (
              <li
                key={r._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3"
              >
                <div>
                  <p className="font-black dark:text-white">{r.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Статус: {r.status} · дедлайн подання: {formatUk(r.deadline)}
                  </p>
                </div>
                {canEditTournament && r.status === 'SUBMISSION_CLOSED' && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs shrink-0"
                    onClick={async () => {
                      try {
                        await assignJuryToRoundApi(r._id);
                        pushToast('Розподіл журі створено');
                        void reload();
                      } catch (ex) {
                        pushToast(ex instanceof Error ? ex.message : 'Помилка');
                      }
                    }}
                  >
                    Розподілити роботи журі
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {canEditTournament && (
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-black dark:text-white">Керування (організатор / адмін)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-xs font-black uppercase text-slate-500">
              Статус (лише вперед)
              <select
                className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold"
                value={tournament.status}
                onChange={async (e) => {
                  const status = e.target.value as TournamentDoc['status'];
                  try {
                    const updated = await updateTournamentApi(id, { status });
                    setTournament(updated);
                    pushToast('Статус оновлено');
                    void reload();
                  } catch (ex) {
                    pushToast(ex instanceof Error ? ex.message : 'Помилка');
                  }
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-black uppercase text-slate-500">
              Назва
              <input
                defaultValue={tournament.name}
                className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold"
                onBlur={async (e) => {
                  const name = e.target.value.trim();
                  if (!name || name === tournament.name) return;
                  try {
                    const updated = await updateTournamentApi(id, { name });
                    setTournament(updated);
                    pushToast('Збережено');
                  } catch (ex) {
                    pushToast(ex instanceof Error ? ex.message : 'Помилка');
                  }
                }}
              />
            </label>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-black dark:text-white">Команди ({teams.length})</h2>
        <ul className="space-y-2 text-sm">
          {teams.map((t) => (
            <li
              key={t._id}
              className="flex flex-wrap justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 items-center"
            >
              <span className="font-bold">{t.name}</span>
              <span className="text-slate-500 truncate">{t.captain?.email}</span>
              <span className="flex gap-2 ml-auto">
                {isAdmin && (
                  <button
                    type="button"
                    className="text-blue-600 font-bold text-xs"
                    onClick={() => setInspectTeam(t)}
                  >
                    Переглянути
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    className="text-red-600 font-bold text-xs"
                    onClick={async () => {
                      if (!confirm('Видалити команду?')) return;
                      try {
                        await deleteTeamApi(t._id);
                        pushToast('Команду видалено');
                        void reload();
                      } catch (ex) {
                        pushToast(ex instanceof Error ? ex.message : 'Помилка');
                      }
                    }}
                  >
                    Видалити
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {isParticipant && tournament.status === 'REGISTRATION' && (
        <TeamPanel
          tournament={tournament}
          myTeam={myTeam}
          user={user}
          onReload={reload}
          pushToast={pushToast}
        />
      )}

      {inspectTeam && (
        <TeamInspectModal team={inspectTeam} onClose={() => setInspectTeam(null)} />
      )}

      {isParticipant && tournament.status !== 'REGISTRATION' && myTeam && (
        <Card className="p-6">
          <h3 className="font-black dark:text-white mb-2">Ваша команда: {myTeam.name}</h3>
          <p className="text-sm text-slate-500">
            Капітан: {myTeam.captain.fullName} ({myTeam.captain.email})
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Учасники:{' '}
            {myTeam.members.map((m) => `${m.fullName} (${m.email})`).join(', ') || '—'}
          </p>
        </Card>
      )}
    </div>
  );
}

function TeamInspectModal({ team, onClose }: { team: TeamDoc; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <Card className="max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-xl font-black dark:text-white">{team.name}</h3>
          <button type="button" className="text-slate-500 font-bold text-lg leading-none" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="text-sm space-y-3 text-slate-700 dark:text-slate-200">
          <p>
            <span className="font-black">Капітан:</span> {team.captain.fullName} ({team.captain.email})
          </p>
          <div>
            <p className="font-black mb-1">Учасники</p>
            <ul className="list-disc pl-5 space-y-1">
              {team.members.length === 0 && <li>—</li>}
              {team.members.map((m) => (
                <li key={m.email}>
                  {m.fullName} — {m.email}
                </li>
              ))}
            </ul>
          </div>
          {team.organization ? (
            <p>
              <span className="font-black">Організація:</span> {team.organization}
            </p>
          ) : null}
          {team.contact ? (
            <p>
              <span className="font-black">Контакт:</span> {team.contact}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="secondary" onClick={onClose}>
          Закрити
        </Button>
      </Card>
    </div>
  );
}

function TeamPanel({
  tournament,
  myTeam,
  user,
  onReload,
  pushToast,
}: {
  tournament: TournamentDoc;
  myTeam: TeamDoc | undefined;
  user: UserProfile;
  onReload: () => Promise<void>;
  pushToast: (s: string) => void;
}) {
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState(user.name || '');
  const [captainEmail, setCaptainEmail] = useState(user.email || '');
  const [memberRows, setMemberRows] = useState<{ fullName: string; email: string }[]>([]);
  const [newMember, setNewMember] = useState({ fullName: '', email: '' });
  const [rename, setRename] = useState('');

  const minM = tournament.minTeamMembers ?? 2;
  const maxM = tournament.maxTeamMembers ?? 5;

  useEffect(() => {
    if (myTeam) {
      setRename(myTeam.name);
    }
  }, [myTeam]);

  if (myTeam) {
    return (
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-black dark:text-white">Моя команда</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={rename}
            onChange={(e) => setRename(e.target.value)}
            className="flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              try {
                await updateTeamNameApi(myTeam._id, { name: rename.trim() });
                pushToast('Назву оновлено');
                await onReload();
              } catch (e) {
                pushToast(e instanceof Error ? e.message : 'Помилка');
              }
            }}
          >
            Зберегти назву
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Капітан: {myTeam.captain.fullName} ({myTeam.captain.email})
        </p>
        <ul className="text-sm space-y-1">
          {myTeam.members.map((m) => (
            <li key={m.email} className="flex justify-between gap-2">
              <span>
                {m.fullName} — {m.email}
              </span>
              <button
                type="button"
                className="text-red-600 font-bold text-xs"
                onClick={async () => {
                  try {
                    await removeTeamMemberApi(myTeam._id, m.email);
                    pushToast('Учасника видалено');
                    await onReload();
                  } catch (e) {
                    pushToast(e instanceof Error ? e.message : 'Помилка');
                  }
                }}
              >
                Видалити
              </button>
            </li>
          ))}
        </ul>
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            placeholder="Повне імʼя нового учасника"
            value={newMember.fullName}
            onChange={(e) => setNewMember((p) => ({ ...p, fullName: e.target.value }))}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
          />
          <input
            placeholder="Email нового учасника"
            type="email"
            value={newMember.email}
            onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
          />
        </div>
        <Button
          type="button"
          onClick={async () => {
            try {
              await addTeamMemberApi(myTeam._id, {
                fullName: newMember.fullName.trim(),
                email: newMember.email.trim(),
              });
              setNewMember({ fullName: '', email: '' });
              pushToast('Учасника додано');
              await onReload();
            } catch (e) {
              pushToast(e instanceof Error ? e.message : 'Помилка');
            }
          }}
        >
          Додати учасника
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-full sm:w-auto"
          onClick={async () => {
            if (!confirm('Видалити вашу команду?')) return;
            try {
              await deleteTeamApi(myTeam._id);
              pushToast('Команду видалено');
              await onReload();
            } catch (e) {
              pushToast(e instanceof Error ? e.message : 'Помилка');
            }
          }}
        >
          Видалити команду
        </Button>
      </Card>
    );
  }

  const captainOk = captainName.trim().length > 0 && captainEmail.trim().length > 0;
  const filledCount =
    (captainOk ? 1 : 0) + memberRows.filter((m) => m.fullName.trim() && m.email.trim()).length;
  const needToMin = Math.max(0, minM - filledCount);
  const slotsToMax = Math.max(0, maxM - filledCount);

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-black dark:text-white">Створити команду</h2>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
        Склад: {filledCount} з {maxM} (мінімум {minM}).
        {needToMin > 0 && <> Ще потрібно для мінімуму: {needToMin}.</>}
        {slotsToMax > 0 && <> До повного складу можна додати ще: {slotsToMax}.</>}
      </p>
      <input
        placeholder="Назва команди"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
      />
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          placeholder="Повне імʼя капітана"
          value={captainName}
          onChange={(e) => setCaptainName(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
        />
        <input
          placeholder="Email капітана"
          type="email"
          value={captainEmail}
          onChange={(e) => setCaptainEmail(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
        />
      </div>
      {memberRows.map((row, idx) => (
        <div key={idx} className="grid sm:grid-cols-2 gap-2 items-end">
          <input
            placeholder="Повне імʼя"
            value={row.fullName}
            onChange={(e) => {
              const v = e.target.value;
              setMemberRows((rows) => rows.map((r, i) => (i === idx ? { ...r, fullName: v } : r)));
            }}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
          />
          <div className="flex gap-2">
            <input
              placeholder="Email"
              type="email"
              value={row.email}
              onChange={(e) => {
                const v = e.target.value;
                setMemberRows((rows) => rows.map((r, i) => (i === idx ? { ...r, email: v } : r)));
              }}
              className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white"
            />
            <Button type="button" variant="secondary" onClick={() => setMemberRows((r) => r.filter((_, i) => i !== idx))}>
              ✕
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => setMemberRows((r) => [...r, { fullName: '', email: '' }])}
      >
        + Рядок учасника
      </Button>
      <Button
        type="button"
        onClick={async () => {
          const members = memberRows.filter((m) => m.email && m.fullName);
          if (!teamName.trim()) {
            pushToast('Вкажіть назву команди');
            return;
          }
          if (members.length + 1 < minM || members.length + 1 > maxM) {
            pushToast(`Кількість учасників (з капітаном) має бути ${minM}–${maxM}`);
            return;
          }
          try {
            await createTeamApi({
              name: teamName.trim(),
              tournamentId: tournament._id,
              captain: { fullName: captainName.trim(), email: captainEmail.trim() },
              members,
            });
            pushToast('Команду створено');
            await onReload();
          } catch (e) {
            pushToast(e instanceof Error ? e.message : 'Помилка');
          }
        }}
      >
        Створити команду
      </Button>
    </Card>
  );
}
