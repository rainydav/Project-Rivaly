import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Badge, Button, Card } from '../components/ui';
import { completeCourseApi } from '../lib/profileApi';

export function CoursePlayerPage() {
  const { id } = useParams();
  const { courses, markModuleComplete, pushToast, applyServerUser } = useApp();
  const course = useMemo(() => courses.find((c) => c.id === id), [courses, id]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  if (!course) {
    return <p className="text-xl font-black dark:text-white">Курс не знайдено.</p>;
  }

  if (!course.enrolled) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
          Спочатку запишіться на курс зі сторінки курсу.
        </p>
        <Link to={`/learning/${course.id}`}>
          <Button>Назад до курсу</Button>
        </Link>
      </div>
    );
  }

  const defaultActive = course.modules[0]?.id ?? null;
  const active = course.modules.find((m) => m.id === (activeId || defaultActive));

  const isLocked = (index: number) => {
    if (index === 0) return false;
    const prev = course.modules[index - 1];
    return !completed.includes(prev.id);
  };

  return (
    <div className="grid lg:grid-cols-[320px,1fr] gap-8">
      <Card className="p-6 h-fit lg:sticky lg:top-8">
        <h3 className="text-lg font-black dark:text-white mb-4">Уроки</h3>
        <ul className="space-y-2">
          {course.modules.map((m, i) => {
            const locked = isLocked(i);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setActiveId(m.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    active?.id === m.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {i + 1}. {m.title}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-8 min-h-[480px]">
        {!active ? (
          <p className="text-slate-500">Оберіть урок.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <h2 className="text-3xl font-black dark:text-white">{active.title}</h2>
              <Badge variant="slate">{active.type}</Badge>
            </div>
            {active.type === 'video' && (
              <div className="aspect-video rounded-[32px] overflow-hidden bg-black border border-slate-800">
                <iframe
                  title={active.title}
                  className="w-full h-full"
                  src={active.content}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}
            {active.type === 'article' && (
              <article className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                {active.content}
              </article>
            )}
            {active.type === 'quiz' && (
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="font-black dark:text-white mb-3">Контрольний тест</p>
                <p className="text-sm text-slate-500 mb-4">
                  Пройдіть відповідний тест у розділі «Тести» на платформі.
                </p>
                <Link to="/tests">
                  <Button className="px-5 py-2">До тестів</Button>
                </Link>
              </div>
            )}
            <Button
              variant="secondary"
              className="px-5 py-2"
              onClick={async () => {
                const next = Array.from(new Set([...completed, active.id]));
                setCompleted(next);
                markModuleComplete(course.id, active.id);
                const allDone = course.modules.every((m) => next.includes(m.id));
                if (allDone) {
                  try {
                    const u = await completeCourseApi(course.id);
                    applyServerUser(u);
                    pushToast('Курс зараховано у вашій статистиці.');
                  } catch (e) {
                    pushToast(e instanceof Error ? e.message : 'Не вдалося зафіксувати курс');
                  }
                }
              }}
            >
              Позначити модуль завершеним
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
