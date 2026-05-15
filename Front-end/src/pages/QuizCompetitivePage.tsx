import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { fetchMe } from '../lib/authApi';
import {
  fetchQuizByIdApi,
  finishQuizSessionApi,
  gradeQuizAnswerApi,
} from '../lib/quizzesApi';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { Button } from '../components/ui';

type Q = { id: string; text: string; options: string[]; limit: number };

function genderMessage(correct: boolean, gender: string) {
  if (!correct) return ['Не здавайся!', 'Наступне точно за тобою!', 'Ти наздоженеш!'];
  if (gender === 'female') return ['Молодчинка!', 'Ти супер!', 'Неймовірна швидкість!'];
  if (gender === 'male') return ['Молодець!', 'Ти справжній про!', 'Так тримати!'];
  return ['Класно!', 'Супер!', 'Так тримати!'];
}

export function QuizCompetitivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, pushToast, applyServerUser } = useApp();
  const [bank, setBank] = useState<Q[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [persistQuizId, setPersistQuizId] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'demo') {
      navigate('/quizzes', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const doc = await fetchQuizByIdApi(id);
        if (cancelled) return;
        const mapped: Q[] = (doc.questions || []).map((row) => ({
          id: row.id,
          text: row.text,
          options: row.options,
          limit: Math.max(3, row.timeLimitSec ?? 15),
        }));
        if (!mapped.length) {
          setLoadErr('У вікторини немає питань');
          setBank([]);
          setPersistQuizId(null);
          return;
        }
        setBank(mapped);
        setQuizTitle(doc.title);
        setPersistQuizId(id);
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : 'Помилка завантаження');
          setBank([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [violations, setViolations] = useState(0);
  const [phase, setPhase] = useState<'play' | 'transition'>('play');
  const [transition, setTransition] = useState<{
    points: number;
    correct: boolean;
    sec: number;
  } | null>(null);
  const [remaining, setRemaining] = useState(15);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [review, setReview] = useState<Record<string, boolean>>({});
  const [answerLog, setAnswerLog] = useState<Record<string, number>>({});
  const tickRef = useRef<number | null>(null);
  const savedFinishRef = useRef(false);
  const bankLenRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);
  const scoringLockRef = useRef(false);

  bankLenRef.current = bank.length;

  useEffect(() => {
    if (!persistQuizId) return;
    setIdx(0);
    setRemaining(bank[0]?.limit ?? 15);
    setFinished(false);
    setStarted(false);
    setScore(0);
    setCombo(0);
    setViolations(0);
    setReview({});
    setAnswerLog({});
    savedFinishRef.current = false;
    scoringLockRef.current = false;
  }, [persistQuizId]);

  useEffect(() => {
    if (!finished || !persistQuizId || savedFinishRef.current) return;
    savedFinishRef.current = true;
    void (async () => {
      try {
        await finishQuizSessionApi(persistQuizId, { score, answers: answerLog });
        const me = await fetchMe();
        if (me) applyServerUser(me);
      } catch {
        pushToast('Не вдалося зберегти результат вікторини');
      }
    })();
  }, [finished, persistQuizId, score, answerLog, applyServerUser, pushToast]);

  const q = bank[idx];

  const clearTick = useCallback(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  const runTransition = useCallback(() => {
    if (transitionTimerRef.current) window.clearInterval(transitionTimerRef.current);
    setPhase('transition');
    let left = 3;
    transitionTimerRef.current = window.setInterval(() => {
      left -= 1;
      setTransition((tr) => (tr ? { ...tr, sec: left } : tr));
      if (left <= 0) {
        if (transitionTimerRef.current) window.clearInterval(transitionTimerRef.current);
        transitionTimerRef.current = null;
        setPhase('play');
        setTransition(null);
        setIdx((i) => {
          const len = bankLenRef.current;
          if (len === 0 || i >= len - 1) {
            setFinished(true);
            scoringLockRef.current = false;
            return i;
          }
          scoringLockRef.current = false;
          return i + 1;
        });
      }
    }, 1000);
  }, []);

  const applyScoring = useCallback(
    async (opt: number, secondsLeft: number) => {
      if (scoringLockRef.current || phase !== 'play' || finished || !q) return;
      scoringLockRef.current = true;
      clearTick();

      let correct = false;
      let base = 500;
      const limit = q.limit;

      if (persistQuizId && opt >= 0) {
        try {
          const graded = await gradeQuizAnswerApi(persistQuizId, q.id, opt);
          correct = graded.correct;
          base = graded.basePoints;
          setAnswerLog((log) => ({ ...log, [q.id]: opt }));
        } catch {
          pushToast('Помилка перевірки відповіді');
          scoringLockRef.current = false;
          return;
        }
      } else if (opt < 0) {
        correct = false;
        setAnswerLog((log) => ({ ...log, [q.id]: -1 }));
      }

      const secondsTaken = limit - secondsLeft;
      const speedBonus = correct
        ? Math.max(0, Math.floor(((limit - secondsTaken) / limit) * 500))
        : 0;
      const points = correct ? Math.round((base + speedBonus) * (combo >= 3 ? 1.2 : 1)) : -800;
      setScore((s) => s + points);
      setCombo((c) => (correct ? c + 1 : 0));
      const msgPool = genderMessage(correct, user.gender);
      pushToast(msgPool[Math.floor(Math.random() * msgPool.length)]);
      setTransition({ points, correct, sec: 3 });
      runTransition();
    },
    [clearTick, combo, finished, phase, persistQuizId, pushToast, q, runTransition, user.gender]
  );

  const scoringRef = useRef<(opt: number, secondsLeft: number) => void>(() => {});

  scoringRef.current = (opt, secondsLeft) => {
    void applyScoring(opt, secondsLeft);
  };

  useEffect(() => {
    if (!started || finished || phase !== 'play' || !q) return;
    setRemaining(q.limit);
    clearTick();
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearTick();
          scoringRef.current(-1, 0);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return clearTick;
  }, [clearTick, finished, phase, q, started]);

  const goViolation = useCallback(() => {
    if (scoringLockRef.current || !started || finished || phase !== 'play' || !q) return;
    scoringLockRef.current = true;
    clearTick();
    setViolations((v) => v + 1);
    setCombo(0);
    setTransition({ points: 0, correct: false, sec: 3 });
    setAnswerLog((log) => ({ ...log, [q.id]: -1 }));
    runTransition();
    pushToast('Питання пропущено через зміну фокусу.');
  }, [clearTick, finished, phase, pushToast, q, runTransition, started]);

  useAntiCheat({ enabled: started && phase === 'play' && !finished, onViolation: goViolation });

  const palette = useMemo(() => {
    return bank.map((qq, i) => {
      if (review[qq.id]) return 'review';
      if (i === idx && phase === 'play') return 'current';
      if (i < idx) return 'done';
      return 'pending';
    });
  }, [bank, idx, phase, review]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500 font-bold">
        Завантаження вікторини…
      </div>
    );
  }

  if (loadErr || bank.length === 0) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-600 font-bold">{loadErr || 'Вікторину не знайдено'}</p>
        <Button variant="secondary" onClick={() => navigate('/quizzes')}>
          До вікторин
        </Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-10 space-y-4 text-center">
          <h1 className="text-3xl font-black dark:text-white">{quizTitle || 'Вікторина'}</h1>
          <p className="text-sm text-slate-500">Питань: {bank.length}. Результат збережеться у профілі.</p>
          <Button className="w-full py-4" onClick={() => setStarted(true)}>
            Почати
          </Button>
          <Button type="button" variant="secondary" className="w-full py-3" onClick={() => navigate('/quizzes')}>
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 p-6 bg-slate-950 text-white">
        <h2 className="text-3xl font-black">Фініш</h2>
        <p className="text-5xl font-black text-indigo-400">{score}</p>
        <p className="text-sm text-slate-400">Результат збережено у вашій статистиці вікторин</p>
        <Button type="button" variant="secondary" onClick={() => navigate('/quizzes')}>
          До вікторин
        </Button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 text-slate-50 flex">
      <aside className="hidden md:flex w-64 border-r border-slate-800 flex-col p-4 gap-2">
        <p className="text-xs font-black uppercase text-slate-500">Палітра</p>
        {palette.map((st, i) => (
          <button
            key={bank[i].id}
            type="button"
            onClick={() => setReview((r) => ({ ...r, [bank[i].id]: !r[bank[i].id] }))}
            className={`h-10 rounded-xl text-xs font-black border ${
              st === 'done'
                ? 'bg-emerald-600 border-emerald-500'
                : st === 'current'
                  ? 'bg-red-500 border-red-400 ring-2 ring-red-300'
                  : st === 'review'
                    ? 'bg-orange-500 border-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur gap-2">
          <button
            type="button"
            onClick={() => navigate('/quizzes')}
            className="text-xs font-black text-slate-400 hover:text-white underline-offset-2 hover:underline shrink-0"
          >
            Назад
          </button>
          <div className="text-xs sm:text-sm font-black truncate text-center flex-1">
            Серія: {combo} · Порушення: {violations}
          </div>
          <motion.div className="text-base sm:text-lg font-black text-indigo-400 shrink-0">{score} pts</motion.div>
          <div className="text-xs sm:text-sm font-bold text-slate-400 shrink-0">{remaining}s</div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {phase === 'transition' && transition ? (
              <motion.div
                key="tr"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-indigo-500 flex items-center justify-center text-3xl sm:text-4xl font-black mx-auto">
                  {transition.sec}
                </div>
                <p className="text-xl sm:text-2xl font-black">
                  {transition.correct ? 'Вірно!' : 'Невірно / час'}
                </p>
                <p className="text-3xl sm:text-4xl font-black text-indigo-400">{transition.points} pts</p>
              </motion.div>
            ) : (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="max-w-2xl w-full space-y-6"
              >
                <div className="p-6 sm:p-8 rounded-[32px] bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
                  <p className="text-xs font-black uppercase text-indigo-400 mb-2">
                    Питання {idx + 1}/{bank.length}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black leading-snug">{q.text}</h2>
                </div>
                <div className="grid gap-3">
                  {q.options.map((opt, i) => (
                    <motion.button
                      key={opt}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => scoringRef.current(i, remaining)}
                      className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900 text-left font-bold hover:border-indigo-500 transition-colors"
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
