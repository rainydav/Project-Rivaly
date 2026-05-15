import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/ui';
import {
  fetchMyJuryAssignmentsApi,
  submitJuryEvaluationApi,
  type JuryAssignment,
} from '../lib/evaluationsApi';
import type { EvaluationCriterion } from '../lib/tournamentsApi';

const DEFAULT_CRITERIA: EvaluationCriterion[] = [
  { key: 'backendCodeQuality', label: 'Якість backend-коду' },
  { key: 'database', label: 'База даних' },
  { key: 'frontendCodeQuality', label: 'Якість frontend' },
  { key: 'mustHaveCompletion', label: 'Must-have / повнота' },
  { key: 'reliability', label: 'Надійність' },
  { key: 'usability', label: 'Зручність (UX)' },
];

function criteriaFor(a: JuryAssignment): EvaluationCriterion[] {
  const raw = a.tournament?.evaluationCriteria;
  if (raw && raw.length > 0) return raw;
  return DEFAULT_CRITERIA;
}

export function JuryAssignmentsPage() {
  const { pushToast } = useApp();
  const [rows, setRows] = useState<JuryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchMyJuryAssignmentsApi();
      setRows(list);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Не вдалося завантажити');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const open = useMemo(() => rows.find((r) => r._id === openId) || null, [rows, openId]);

  useEffect(() => {
    if (!open) {
      setScores({});
      setComment('');
      return;
    }
    const crit = criteriaFor(open);
    const init: Record<string, number> = {};
    for (const c of crit) init[c.key] = 70;
    setScores(init);
    setComment('');
  }, [open]);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-black dark:text-white">Оцінювання робіт</h1>
        <p className="text-slate-500 font-bold mt-2">
          Призначені вам подання після закриття прийому (статус раунду SUBMISSION_CLOSED або EVALUATED).
        </p>
      </div>
      {loading && <p className="text-slate-500 font-bold">Завантаження…</p>}
      {!loading && rows.length === 0 && (
        <Card className="p-8">
          <p className="text-slate-600 dark:text-slate-300 font-bold">
            Наразі немає призначень. Організатор або адміністратор розподіляє роботи після закриття подань у раунді.
          </p>
        </Card>
      )}
      <ul className="space-y-4">
        {rows.map((a) => (
          <li key={a._id}>
            <Card className="p-6">
              <div className="flex flex-wrap justify-between gap-4 items-start">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">
                    {a.tournament?.name ?? 'Турнір'} · {a.round?.title}
                  </p>
                  <p className="text-lg font-black dark:text-white mt-1">
                    Команда: {a.submission?.team?.name ?? '—'}
                  </p>
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    {a.submission?.githubUrl ? (
                      <p>
                        GitHub:{' '}
                        <a href={a.submission.githubUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                          {a.submission.githubUrl}
                        </a>
                      </p>
                    ) : null}
                    {a.submission?.demoUrl ? (
                      <p>
                        Демо:{' '}
                        <a href={a.submission.demoUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                          {a.submission.demoUrl}
                        </a>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span
                    className={`text-[10px] font-black uppercase px-3 py-1 rounded-xl ${
                      a.status === 'EVALUATED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {a.status === 'EVALUATED' ? 'Оцінено' : 'Очікує оцінки'}
                  </span>
                  <Button type="button" variant="secondary" className="text-xs" onClick={() => setOpenId(a._id)}>
                    {a.status === 'EVALUATED' ? 'Переглянути / змінити' : 'Оцінити'}
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {open && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <Card className="max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-xl font-black dark:text-white">Бали (0–100)</h3>
              <button
                type="button"
                className="text-slate-500 font-bold text-lg leading-none"
                onClick={() => setOpenId(null)}
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {criteriaFor(open).map((c) => (
                <label key={c.key} className="block text-xs font-black uppercase text-slate-500">
                  {c.label}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scores[c.key] ?? 0}
                    onChange={(e) =>
                      setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))
                    }
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold"
                  />
                </label>
              ))}
            </div>
            <label className="block text-xs font-black uppercase text-slate-500">
              Коментар
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="mt-1 w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white font-bold"
              />
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await submitJuryEvaluationApi(open._id, { scores, comment: comment.trim() });
                    pushToast('Оцінку збережено');
                    setOpenId(null);
                    void reload();
                  } catch (e) {
                    pushToast(e instanceof Error ? e.message : 'Помилка');
                  }
                }}
              >
                Зберегти оцінку
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpenId(null)}>
                Скасувати
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
