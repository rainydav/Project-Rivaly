import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useApp } from '../context/AppContext';
import {
  createQuizApi,
  deleteQuizApi,
  fetchQuizByIdApi,
  fetchQuizzesListApi,
  updateQuizApi,
  type QuizDoc,
} from '../lib/quizzesApi';

type QRow = QuizDoc['questions'][number];

export function AdminQuizPage() {
  const { pushToast, user } = useApp();
  const [list, setList] = useState<QuizDoc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('Нова вікторина');
  const [competitive, setCompetitive] = useState(true);
  const [questions, setQuestions] = useState<QRow[]>([
    {
      id: '1',
      text: '2+2?',
      options: ['3', '4', '5'],
      correctIndex: 1,
      points: 10,
      timeLimitSec: 12,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const reloadList = useCallback(async () => {
    try {
      setList(await fetchQuizzesListApi());
    } catch {
      setList([]);
    }
  }, []);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  const loadOne = async (id: string) => {
    setLoading(true);
    try {
      const q = await fetchQuizByIdApi(id);
      setActiveId(q._id);
      setTitle(q.title);
      setCompetitive(q.competitive);
      setQuestions(
        (q.questions || []).map((row) => ({
          id: row.id,
          text: row.text,
          options: row.options,
          correctIndex: row.correctIndex ?? 0,
          points: row.points ?? 10,
          timeLimitSec: row.timeLimitSec ?? 15,
        }))
      );
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  const newBlank = () => {
    setActiveId(null);
    setTitle('Нова вікторина');
    setCompetitive(true);
    setQuestions([
      {
        id: String(Date.now()),
        text: 'Столиця України?',
        options: ['Львів', 'Київ', 'Одеса'],
        correctIndex: 1,
        points: 10,
        timeLimitSec: 15,
      },
    ]);
  };

  const addQuestion = () =>
    setQuestions((qs) => [
      ...qs,
      {
        id: String(Date.now()),
        text: 'Нове питання',
        options: ['Так', 'Ні'],
        correctIndex: 0,
        points: 10,
        timeLimitSec: 15,
      },
    ]);

  const save = async () => {
    try {
      if (activeId) {
        await updateQuizApi(activeId, { title, competitive, questions });
        pushToast('Вікторину збережено');
      } else {
        const created = await createQuizApi({ title, competitive, questions });
        setActiveId(created._id);
        pushToast('Створено');
      }
      void reloadList();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Помилка');
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-4xl font-black dark:text-white">Вікторина — конструктор</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin">
            <Button variant="secondary" className="px-5 py-3" type="button">
              Меню конструктора
            </Button>
          </Link>
          <Button type="button" variant="secondary" onClick={newBlank}>
            Нова вікторина
          </Button>
          <Button type="button" onClick={() => void save()}>
            Зберегти на сервері
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-3">
        <h3 className="font-black dark:text-white">Вікторини в базі</h3>
        {loading && <p className="text-xs text-slate-500 font-bold">Завантаження…</p>}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {list.map((q) => (
            <li key={q._id} className="py-2 flex flex-wrap justify-between gap-2 items-center">
              <button
                type="button"
                className="font-bold text-blue-600 hover:underline text-left"
                onClick={() => void loadOne(q._id)}
              >
                {q.title}
              </button>
              <div className="flex gap-2 items-center">
                <Link to={`/quiz/live/${q._id}`} className="text-xs font-bold text-slate-500 hover:text-indigo-600">
                  Грати
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600"
                    onClick={async () => {
                      if (!confirm('Видалити вікторину?')) return;
                      try {
                        await deleteQuizApi(q._id);
                        pushToast('Видалено');
                        if (activeId === q._id) newBlank();
                        void reloadList();
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

      <Card className="p-8 space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold text-lg"
          placeholder="Назва вікторини"
        />
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={competitive}
            onChange={(e) => setCompetitive(e.target.checked)}
          />
          Змагальний режим (бонус за швидкість на клієнті)
        </label>
      </Card>

      <div className="space-y-4">
        {questions.map((qq, idx) => (
          <Card key={qq.id} className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-black dark:text-white">Питання {idx + 1}</p>
              <button
                type="button"
                className="text-red-500"
                onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== qq.id))}
              >
                <Trash2 size={18} />
              </button>
            </div>
            <textarea
              value={qq.text}
              onChange={(e) =>
                setQuestions((qs) =>
                  qs.map((x) => (x.id === qq.id ? { ...x, text: e.target.value } : x))
                )
              }
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white min-h-[72px]"
            />
            <div className="grid sm:grid-cols-2 gap-2">
              {qq.options.map((opt, i) => (
                <input
                  key={`${qq.id}-o-${i}`}
                  value={opt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQuestions((qs) =>
                      qs.map((x) => {
                        if (x.id !== qq.id) return x;
                        const next = [...x.options];
                        next[i] = v;
                        return { ...x, options: next };
                      })
                    );
                  }}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 dark:text-white text-sm font-bold"
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-center text-xs font-black text-slate-500">
              <label className="flex items-center gap-2">
                Ліміт (с)
                <input
                  type="number"
                  min={3}
                  value={qq.timeLimitSec ?? 15}
                  onChange={(e) =>
                    setQuestions((qs) =>
                      qs.map((x) =>
                        x.id === qq.id
                          ? { ...x, timeLimitSec: Math.max(3, Number(e.target.value) || 15) }
                          : x
                      )
                    )
                  }
                  className="w-20 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 dark:text-white"
                />
              </label>
              <label className="flex items-center gap-2">
                Правильний
                <select
                  className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 dark:text-white"
                  value={qq.correctIndex ?? 0}
                  onChange={(e) =>
                    setQuestions((qs) =>
                      qs.map((x) =>
                        x.id === qq.id ? { ...x, correctIndex: Number(e.target.value) } : x
                      )
                    )
                  }
                >
                  {qq.options.map((_, i) => (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                Бали
                <input
                  type="number"
                  value={qq.points}
                  onChange={(e) =>
                    setQuestions((qs) =>
                      qs.map((x) =>
                        x.id === qq.id ? { ...x, points: Number(e.target.value) } : x
                      )
                    )
                  }
                  className="w-20 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 dark:text-white"
                />
              </label>
              <Button type="button" variant="secondary" className="text-xs py-1 px-2" onClick={() =>
                setQuestions((qs) =>
                  qs.map((x) =>
                    x.id === qq.id ? { ...x, options: [...x.options, 'Новий варіант'] } : x
                  )
                )
              }>
                <Plus size={14} /> Варіант
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Button variant="secondary" onClick={addQuestion}>
        <Plus size={18} /> Додати питання
      </Button>
    </div>
  );
}
