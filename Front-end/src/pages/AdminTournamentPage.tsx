import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Badge } from '../components/ui';
import {
  createTournamentApi,
  deleteTournamentApi,
  fetchTournamentsList,
  type TournamentDoc,
  type RoundDoc,
} from '../lib/tournamentsApi';
import {
  changeRoundStatusApi,
  createRoundApi,
  fetchTournamentRoundsApi,
} from '../lib/roundsApi';
import { useApp } from '../context/AppContext';

function toIsoFromLocal(dtLocal: string) {
  if (!dtLocal) return '';
  const d = new Date(dtLocal);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function toLocalInputValue(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatUk(iso: string) {
  try {
    return new Date(iso).toLocaleString('uk-UA');
  } catch {
    return iso;
  }
}

function defaultRoundWindow(t: TournamentDoc) {
  const start = t.startDate ? new Date(t.startDate) : new Date(t.registrationEnd || Date.now());
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { startsAt: toLocalInputValue(start.toISOString()), deadline: toLocalInputValue(end.toISOString()) };
}

function roundStatusLabel(status: RoundDoc['status']) {
  switch (status) {
    case 'DRAFT':
      return 'Чернетка';
    case 'ACTIVE':
      return 'Прийом відкрито';
    case 'SUBMISSION_CLOSED':
      return 'Прийом закрито';
    case 'EVALUATED':
      return 'Оцінено';
    default:
      return status;
  }
}

function TournamentRoundsPanel({
  tournament,
  pushToast,
}: {
  tournament: TournamentDoc;
  pushToast: (msg: string) => void;
}) {
  const [rounds, setRounds] = useState<RoundDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Раунд 1 — здача робіт');
  const [description, setDescription] = useState('');
  const [techReq, setTechReq] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [deadline, setDeadline] = useState('');
  const [evalDeadline, setEvalDeadline] = useState('');
  const [openImmediately, setOpenImmediately] = useState(true);
  const [saving, setSaving] = useState(false);

  const reloadRounds = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchTournamentRoundsApi(tournament._id);
      setRounds(rows);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Помилка завантаження раундів');
      setRounds([]);
    } finally {
      setLoading(false);
    }
  }, [pushToast, tournament._id]);

  useEffect(() => {
    const win = defaultRoundWindow(tournament);
    setStartsAt(win.startsAt);
    setDeadline(win.deadline);
    if (!description.trim() && tournament.description) {
      setDescription(tournament.description);
    }
    void reloadRounds();
  }, [tournament._id, tournament.description, tournament.registrationEnd, tournament.startDate, reloadRounds]);

  const canCreate =
    tournament.status !== 'FINISHED' &&
    title.trim() &&
    description.trim() &&
    startsAt &&
    deadline;

  return (
    <Card id="tournament-rounds-panel" className="p-8 space-y-6 border-2 border-amber-500/30">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h3 className="text-xl font-black dark:text-white">Раунди: {tournament.name}</h3>
          <p className="text-sm text-slate-500 font-bold mt-1">
            Статус турніру: <Badge>{tournament.status}</Badge>
            {tournament.status === 'DRAFT' || tournament.status === 'REGISTRATION' ? (
              <span className="block mt-2 text-amber-600 dark:text-amber-400">
                Для здачі робіт переведіть турнір у статус RUNNING на сторінці турніру (після реєстрації).
              </span>
            ) : null}
          </p>
        </div>
        <Link to={`/tournaments/${tournament._id}`} className="text-sm font-bold text-blue-600 hover:underline">
          Сторінка турніру →
        </Link>
      </div>

      <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
        <h4 className="text-lg font-black dark:text-white">Створити раунд</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Раунд визначає вікно здачі робіт (GitHub + demo). Учасники здають на сторінці «Здати роботу», коли раунд
          активний.
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Назва раунду"
          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
        />
        <label className="block text-xs font-black uppercase text-slate-500">
          Завдання / опис для учасників
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Що потрібно здати, критерії, посилання на ТЗ…"
            className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
          />
        </label>
        <label className="block text-xs font-black uppercase text-slate-500">
          Технічні вимоги (опційно)
          <textarea
            value={techReq}
            onChange={(e) => setTechReq(e.target.value)}
            rows={2}
            className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
          />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-xs font-black uppercase text-slate-500">
            Початок прийому
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-500">
            Дедлайн здачі
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-500 md:col-span-2">
            Дедлайн оцінювання журі (опційно)
            <input
              type="datetime-local"
              value={evalDeadline}
              onChange={(e) => setEvalDeadline(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={openImmediately}
            onChange={(e) => setOpenImmediately(e.target.checked)}
            className="rounded"
          />
          Відкрити прийом одразу (статус ACTIVE), якщо зараз у межах дат
        </label>
        <Button
          className="px-8 py-3"
          disabled={!canCreate || saving}
          onClick={async () => {
            const sa = toIsoFromLocal(startsAt);
            const dl = toIsoFromLocal(deadline);
            if (!sa || !dl) {
              pushToast('Заповніть дати раунду');
              return;
            }
            setSaving(true);
            try {
              await createRoundApi(tournament._id, {
                title: title.trim(),
                description: description.trim(),
                technologyRequirements: techReq.trim(),
                startsAt: sa,
                deadline: dl,
                evaluationDeadline: evalDeadline ? toIsoFromLocal(evalDeadline) : undefined,
                status: openImmediately ? 'ACTIVE' : 'DRAFT',
              });
              pushToast('Раунд створено');
              setTitle(`Раунд ${rounds.length + 2} — здача робіт`);
              void reloadRounds();
            } catch (e) {
              pushToast(e instanceof Error ? e.message : 'Помилка створення раунду');
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'Збереження…' : 'Створити раунд'}
        </Button>
      </div>

      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
        <h4 className="text-lg font-black dark:text-white">Існуючі раунди</h4>
        {loading && <p className="text-slate-500 font-bold text-sm">Завантаження…</p>}
        {!loading && rounds.length === 0 && (
          <p className="text-slate-500 font-bold text-sm">Раундів ще немає. Створіть перший раунд вище.</p>
        )}
        <ul className="space-y-3">
          {rounds.map((r) => (
            <li
              key={r._id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="font-black dark:text-white">{r.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {roundStatusLabel(r.status)} · прийом {formatUk(r.startsAt)} — {formatUk(r.deadline)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.status === 'DRAFT' && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        await changeRoundStatusApi(r._id, 'ACTIVE');
                        pushToast('Раунд активовано');
                        void reloadRounds();
                      } catch (e) {
                        pushToast(e instanceof Error ? e.message : 'Помилка');
                      }
                    }}
                  >
                    Відкрити прийом
                  </Button>
                )}
                {r.status === 'ACTIVE' && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        await changeRoundStatusApi(r._id, 'SUBMISSION_CLOSED');
                        pushToast('Прийом закрито');
                        void reloadRounds();
                      } catch (e) {
                        pushToast(e instanceof Error ? e.message : 'Помилка');
                      }
                    }}
                  >
                    Закрити прийом
                  </Button>
                )}
                <Link to={`/tournaments/play/${tournament._id}`}>
                  <Button type="button" variant="secondary" className="text-xs">
                    Здача
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function AdminTournamentPage() {
  const { pushToast, user } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user.role === 'admin';
  const [list, setList] = useState<TournamentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get('tournament') || null
  );
  const scrolledToRoundsRef = useRef(false);
  const [name, setName] = useState('Новий турнір');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [rules, setRules] = useState('');
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');
  const [startDate, setStartDate] = useState('');
  const [minTeam, setMinTeam] = useState(2);
  const [maxTeam, setMaxTeam] = useState(5);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchTournamentsList();
      setList(rows);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Не вдалося завантажити');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const fromUrl = searchParams.get('tournament');
    if (fromUrl) setSelectedId(fromUrl);
  }, [searchParams]);

  const selected = list.find((t) => t._id === selectedId) || null;

  useEffect(() => {
    if (!selected || scrolledToRoundsRef.current) return;
    scrolledToRoundsRef.current = true;
    window.requestAnimationFrame(() => {
      document.getElementById('tournament-rounds-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selected]);

  const selectTournament = (tournamentId: string | null) => {
    setSelectedId(tournamentId);
    if (tournamentId) {
      setSearchParams({ tournament: tournamentId }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black dark:text-white">Конструктор турнірів</h1>
          <p className="text-slate-500 font-bold mt-2">
            Створіть турнір, потім додайте раунд з вікном здачі — без раунду учасники не зможуть здати роботу.
          </p>
        </div>
        {loading && <Badge>Завантаження…</Badge>}
      </div>

      <Card className="p-8 space-y-4">
        <h3 className="text-xl font-black dark:text-white">Створити турнір</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Назва"
          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
        />
        <label className="block text-xs font-black uppercase text-slate-500">Опис турніру</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Коротко про формат і цілі"
          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
        />
        <label className="block text-xs font-black uppercase text-slate-500">Вимоги</label>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={3}
          placeholder="Хто може брати участь, технічні вимоги тощо"
          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
        />
        <label className="block text-xs font-black uppercase text-slate-500">Правила</label>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={4}
          placeholder="Правила подання, дедлайни, оцінювання"
          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-xs font-black uppercase text-slate-500">
            Початок реєстрації
            <input
              type="datetime-local"
              value={regStart}
              onChange={(e) => setRegStart(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-500">
            Кінець реєстрації
            <input
              type="datetime-local"
              value={regEnd}
              onChange={(e) => setRegEnd(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-500">
            Старт змагання (опційно)
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-black uppercase text-slate-500">
              Мін. у команді
              <input
                type="number"
                min={1}
                value={minTeam}
                onChange={(e) => setMinTeam(Number(e.target.value))}
                className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
              />
            </label>
            <label className="text-xs font-black uppercase text-slate-500">
              Макс. у команді
              <input
                type="number"
                min={2}
                value={maxTeam}
                onChange={(e) => setMaxTeam(Number(e.target.value))}
                className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 dark:text-white"
              />
            </label>
          </div>
        </div>
        <Button
          className="px-8 py-3"
          onClick={async () => {
            const rs = toIsoFromLocal(regStart);
            const re = toIsoFromLocal(regEnd);
            if (!rs || !re) {
              pushToast('Заповніть дати реєстрації');
              return;
            }
            try {
              const created = await createTournamentApi({
                name: name.trim(),
                description: description.trim(),
                requirements: requirements.trim(),
                rules: rules.trim(),
                registrationStart: rs,
                registrationEnd: re,
                startDate: startDate ? toIsoFromLocal(startDate) : undefined,
                minTeamMembers: minTeam,
                maxTeamMembers: maxTeam,
                format: 'SINGLE_ROUND',
              });
              pushToast('Турнір створено. Додайте раунд нижче.');
              selectTournament(created._id);
              setName('Новий турнір');
              setDescription('');
              setRequirements('');
              setRules('');
              void reload();
            } catch (e) {
              pushToast(e instanceof Error ? e.message : 'Помилка');
            }
          }}
        >
          Створити турнір
        </Button>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="text-lg font-black dark:text-white">Турніри та раунди</h3>
        <p className="text-sm text-slate-500 font-bold">
          Оберіть турнір, щоб створити або керувати раундами здачі.
        </p>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((t) => (
            <li key={t._id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  to={`/tournaments/${t._id}`}
                  className="font-black text-blue-600 hover:underline"
                >
                  {t.name}
                </Link>
                <span className="ml-2 text-xs text-slate-500">{t.status}</span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  type="button"
                  variant={selectedId === t._id ? 'primary' : 'secondary'}
                  className="text-xs"
                  onClick={() => selectTournament(selectedId === t._id ? null : t._id)}
                >
                  {selectedId === t._id ? 'Згорнути раунди' : 'Раунди'}
                </Button>
                {isAdmin && (
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600"
                    onClick={async () => {
                      if (!confirm('Видалити турнір?')) return;
                      try {
                        await deleteTournamentApi(t._id);
                        if (selectedId === t._id) selectTournament(null);
                        pushToast('Видалено');
                        void reload();
                      } catch (e) {
                        pushToast(e instanceof Error ? e.message : 'Помилка');
                      }
                    }}
                  >
                    Видалити
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {selected && <TournamentRoundsPanel tournament={selected} pushToast={pushToast} />}
    </div>
  );
}
