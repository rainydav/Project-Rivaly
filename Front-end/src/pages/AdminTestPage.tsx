import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card } from '../components/ui';
import type { QuizQuestion } from '../types';
import { useApp } from '../context/AppContext';
import {
  createTestApi,
  deleteTestApi,
  fetchTestFullApi,
  fetchTestsListApi,
  updateTestApi,
  type TestDoc,
} from '../lib/testsApi';

export function AdminTestPage() {
  const { pushToast, user } = useApp();
  const [list, setList] = useState<TestDoc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('Контрольний модуль');
  const [timer, setTimer] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { id: '1', text: 'Питання 1', options: ['A', 'B', 'C'], correctIndex: 0, points: 5 },
  ]);
  const [loading, setLoading] = useState(false);

  const reloadList = useCallback(async () => {
    try {
      const rows = await fetchTestsListApi();
      setList(rows);
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
      const t = await fetchTestFullApi(id);
      setActiveId(t._id);
      setTitle(t.title);
      setTimer(t.timerMinutes);
      setQuestions(
        (t.questions || []).map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex ?? 0,
          points: q.points ?? 5,
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
    setTitle('Новий тест');
    setTimer(10);
    setQuestions([
      { id: String(Date.now()), text: 'Питання 1', options: ['A', 'B', 'C'], correctIndex: 0, points: 5 },
    ]);
  };

  const addQuestion = () =>
    setQuestions((q) => [
      ...q,
      {
        id: String(Date.now()),
        text: 'Нове питання',
        options: ['Варіант 1', 'Варіант 2'],
        correctIndex: 0,
        points: 5,
      },
    ]);

  const addOption = (qid: string) => {
    setQuestions((qs) =>
      qs.map((x) =>
        x.id === qid ? { ...x, options: [...x.options, `Варіант ${x.options.length + 1}`] } : x
      )
    );
  };

  const save = async () => {
    try {
      if (activeId) {
        await updateTestApi(activeId, { title, timerMinutes: timer, questions });
        pushToast('Збережено на сервері');
      } else {
        const created = await createTestApi({ title, timerMinutes: timer, questions });
        setActiveId(created._id);
        pushToast('Тест створено');
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
        <h1 className="text-4xl font-black dark:text-white">Редактор тесту</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin">
            <Button variant="secondary" className="px-5 py-3" type="button">
              Меню конструктора
            </Button>
          </Link>
          <Button type="button" variant="secondary" className="px-5 py-3" onClick={newBlank}>
            Новий тест
          </Button>
          <Button type="button" className="px-5 py-3" onClick={() => void save()}>
            Зберегти на сервері
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-3">
        <h3 className="font-black dark:text-white">Тести в базі</h3>
        {loading && <p className="text-xs text-slate-500 font-bold">Завантаження редактора…</p>}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {list.map((t) => (
            <li key={t._id} className="py-2 flex flex-wrap justify-between gap-2 items-center">
              <button
                type="button"
                className="font-bold text-blue-600 hover:underline text-left"
                onClick={() => void loadOne(t._id)}
              >
                {t.title}
              </button>
              <div className="flex gap-2 items-center">
                <Link to={`/tests/take/${t._id}`} className="text-xs font-bold text-slate-500 hover:text-blue-600">
                  Перейти
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600"
                    onClick={async () => {
                      if (!confirm('Видалити тест з бази?')) return;
                      try {
                        await deleteTestApi(t._id);
                        pushToast('Видалено');
                        if (activeId === t._id) newBlank();
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

      <Card className="p-8 space-y-4 grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500">Назва</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500">Таймер (хв)</label>
          <input
            type="number"
            min={1}
            value={timer}
            onChange={(e) => setTimer(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
          />
        </div>
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
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white min-h-[80px]"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              {qq.options.map((opt, i) => (
                <input
                  key={`${qq.id}-opt-${i}`}
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
                  className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 outline-none dark:text-white text-sm font-bold"
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button type="button" variant="secondary" className="px-4 py-2 text-sm" onClick={() => addOption(qq.id)}>
                <Plus size={16} /> Додати варіант відповіді
              </Button>
              <label className="text-xs font-black text-slate-500 flex items-center gap-2">
                Правильний
                <select
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 font-bold dark:text-white"
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
              <label className="text-xs font-black text-slate-500 flex items-center gap-2">
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
                  className="w-24 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 outline-none dark:text-white"
                />
              </label>
            </div>
          </Card>
        ))}
      </div>
      <Button variant="secondary" className="px-5 py-3" onClick={addQuestion}>
        <Plus size={18} /> Додати питання
      </Button>
    </div>
  );
}
