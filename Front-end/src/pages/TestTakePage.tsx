import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, Maximize2 } from 'lucide-react';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useApp } from '../context/AppContext';
import { patchAnswer } from '../lib/mockApi';
import { fetchMe } from '../lib/authApi';
import { fetchTestByIdApi, submitTestApi } from '../lib/testsApi';
import type { QuestionStatus, QuizQuestion } from '../types';
import { Button } from '../components/ui';

export function TestTakePage() {
  const { id } = useParams<{ id: string }>();
  if (!id || id === 'demo') {
    return <Navigate to="/tests" replace />;
  }
  return <TestTakeSession id={id} />;
}

function TestTakeSession({ id }: { id: string }) {
  const { applyServerUser } = useApp();

  const [remoteTitle, setRemoteTitle] = useState('');
  const [remoteTimerMin, setRemoteTimerMin] = useState(10);
  const [remoteQuestions, setRemoteQuestions] = useState<QuizQuestion[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await fetchTestByIdApi(id);
        if (cancelled) return;
        setRemoteTitle(t.title);
        setRemoteTimerMin(Math.max(1, t.timerMinutes || 10));
        setRemoteQuestions(
          (t.questions || []).map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            points: q.points ?? 5,
          }))
        );
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'Помилка');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const bank = remoteQuestions || [];
  const totalSec = useMemo(() => Math.max(60, remoteTimerMin * 60), [remoteTimerMin]);

  const [started, setStarted] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(totalSec);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [violations, setViolations] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const [finished, setFinished] = useState(false);
  const [attemptId] = useState(() => `att-${Math.random().toString(36).slice(2)}`);
  const [submitting, setSubmitting] = useState(false);
  const [serverResult, setServerResult] = useState<{
    score: number;
    maxScore: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!started) setRemaining(totalSec);
  }, [totalSec, started]);

  const question = bank[index];

  const palette = useMemo(() => {
    return bank.map((q, i): QuestionStatus => {
      if (answers[q.id] === null && i === index) return 'skipped';
      if (answers[q.id] !== undefined && answers[q.id] !== null) return 'done';
      if (answers[q.id] === null) return 'skipped';
      if (i === index) return 'current';
      return 'pending';
    });
  }, [answers, index, bank]);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(0, bank.length - 1)));
  }, [bank.length]);

  const handleViolation = useCallback(async () => {
    if (!started || finished || !question) return;
    const qid = question.id;
    setViolations((v) => v + 1);
    setAnswers((a) => ({ ...a, [qid]: null }));
    await patchAnswer({ attemptId, questionId: qid, answer: null, violationDelta: 1 });
    goNext();
  }, [attemptId, finished, goNext, question, started]);

  useAntiCheat({ enabled: started && !finished, onViolation: handleViolation });

  const submitAndFinish = useCallback(async () => {
    setFinished(true);
    setSubmitting(true);
    try {
      const res = await submitTestApi(id, answers);
      setServerResult(res);
      const me = await fetchMe();
      if (me) applyServerUser(me);
    } catch {
      setServerResult(null);
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, applyServerUser]);

  useEffect(() => {
    if (!started || finished || deadline == null) return;
    const t = window.setInterval(() => {
      const sec = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(sec);
      if (sec <= 0) {
        clearInterval(t);
        void submitAndFinish();
      }
    }, 250);
    return () => clearInterval(t);
  }, [deadline, finished, started, submitAndFinish]);

  const selectOption = async (optIdx: number) => {
    if (!started || finished || !question) return;
    const qid = question.id;
    setAnswers((a) => ({ ...a, [qid]: optIdx }));
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 900);
    await patchAnswer({ attemptId, questionId: qid, answer: optIdx });
    if (index < bank.length - 1) {
      window.setTimeout(() => setIndex((i) => Math.min(i + 1, bank.length - 1)), 350);
    }
  };

  const requestFs = async () => {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen().catch(() => {});
  };

  const finalize = useCallback(() => {
    void submitAndFinish();
  }, [submitAndFinish]);

  if (loadErr) {
    return (
      <motion.div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-600 font-bold">{loadErr}</p>
        <Link to="/tests" className="text-blue-600 font-bold">
          До тестів
        </Link>
      </motion.div>
    );
  }

  if (!remoteQuestions || remoteQuestions.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500 font-bold">
        Завантаження тесту…
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <motion.div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-10 shadow-2xl space-y-6 text-center">
          <h1 className="text-3xl font-black dark:text-white">{remoteTitle}</h1>
          <p className="text-sm text-slate-500">
            Тест з сервера. Результат збережеться у вашій статистиці тестів.
          </p>
          <Button
            className="w-full py-4 text-lg gap-2"
            onClick={async () => {
              await requestFs();
              setDeadline(Date.now() + totalSec * 1000);
              setStarted(true);
            }}
          >
            <Maximize2 size={20} /> Почати тест
          </Button>
        </motion.div>
      </div>
    );
  }

  if (finished) {
    const score = serverResult?.score ?? 0;
    const max = serverResult?.maxScore ?? 0;
    const grade =
      max <= 0 ? '—' : score / max >= 0.9 ? 'A' : score / max >= 0.75 ? 'B' : score / max >= 0.5 ? 'C' : 'D';
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-10 text-center space-y-4">
          <h2 className="text-3xl font-black dark:text-white">Результат</h2>
          {submitting && <p className="text-slate-500 font-bold">Збереження результату…</p>}
          <p className="text-5xl font-black text-blue-600">
            {score}/{max || '—'}
          </p>
          <p className="text-sm text-slate-500">
            Оцінка: <span className="font-black text-slate-900 dark:text-white">{grade}</span> · Порушень:{' '}
            {violations}
            {serverResult && (
              <span className="block mt-1">
                {serverResult.passed ? 'Тест зараховано як пройдений' : 'Прохідний бал не набрано'}
              </span>
            )}
          </p>
          <Link to="/tests">
            <Button className="w-full py-3">Усі тести</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col">
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{
            width: `${Math.min(100, ((totalSec - remaining) / totalSec) * 100)}%`,
          }}
        />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-sm font-black">
          <Clock size={18} className="text-blue-600" />
          <span>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
          <span className="text-slate-400 font-bold">Порушення: {violations}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-emerald-600">
          {savedFlash && (
            <span className="inline-flex items-center gap-1">
              <Check size={16} /> Збережено
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="px-4 py-2 text-sm font-black rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            У меню
          </Link>
          <Button className="px-4 py-2 text-sm" variant="danger" onClick={() => void finalize()}>
            Завершити
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="p-8 rounded-[32px] bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-xl">
                <p className="text-xs font-black uppercase text-blue-600 mb-3">
                  Питання {index + 1} / {bank.length}
                </p>
                <h2 className="text-2xl md:text-3xl font-black leading-snug">{question.text}</h2>
              </div>
              <div className="grid gap-4">
                {question.options.map((opt, i) => {
                  const selected = answers[question.id] === i;
                  return (
                    <motion.button
                      key={opt}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectOption(i)}
                      className={`text-left p-5 rounded-3xl border-2 font-bold transition-all ${
                        selected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <aside className="lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-black uppercase text-slate-500 mb-3">Палітра</p>
          <div className="grid grid-cols-6 lg:grid-cols-4 gap-2">
            {palette.map((st, i) => (
              <button
                key={bank[i].id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-10 rounded-xl text-xs font-black border ${
                  st === 'done'
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : st === 'current'
                      ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
                      : st === 'skipped'
                        ? 'bg-red-500 text-white border-red-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
