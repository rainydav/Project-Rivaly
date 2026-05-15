import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, ExternalLink, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, Button, Card } from '../components/ui';

export function CourseDetailPage() {
  const { id } = useParams();
  const { courses, enrollCourse } = useApp();
  const course = useMemo(() => courses.find((c) => c.id === id), [courses, id]);
  const [joinedSession, setJoinedSession] = useState<string | null>(null);

  if (!course) {
    return <p className="text-xl font-black dark:text-white">Курс не знайдено.</p>;
  }

  const progress =
    course.modules.length === 0
      ? 0
      : Math.round((course.modules.filter((m) => !m.locked).length / course.modules.length) * 100);

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <Badge variant="emerald">{course.difficulty}</Badge>
          <h1 className="text-4xl md:text-5xl font-black dark:text-white mt-3 tracking-tight">
            {course.title}
          </h1>
          <p className="text-slate-500 mt-3 max-w-3xl">{course.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!course.enrolled ? (
            <Button className="px-8 py-3" onClick={() => enrollCourse(course.id)}>
              Взяти участь
            </Button>
          ) : (
            <Badge variant="blue">Ви записані</Badge>
          )}
          <Link to={`/learning/${course.id}/player`}>
            <Button variant="secondary" className="px-8 py-3" disabled={!course.enrolled}>
              Плеєр курсу
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-8">
        <div className="flex justify-between mb-3">
          <h3 className="text-xl font-black dark:text-white">Прогрес</h3>
          <span className="font-black text-blue-600">{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h3 className="text-2xl font-black dark:text-white mb-4">Живі зустрічі</h3>
          <div className="space-y-4">
            {course.sessions.length === 0 && (
              <p className="text-slate-500 text-sm">Немає запланованих сесій.</p>
            )}
            {course.sessions.map((s) => {
              const start = new Date(s.startAt);
              const openAt = start.getTime() - 10 * 60_000;
              const canJoin = Date.now() >= openAt && Date.now() <= start.getTime() + s.durationMin * 60_000;
              return (
                <div
                  key={s.id}
                  className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
                    <Calendar size={14} /> {s.platform}
                  </div>
                  <p className="text-lg font-black dark:text-white">{s.title}</p>
                  <p className="text-sm text-slate-500">
                    Початок: {start.toLocaleString('uk-UA')} · {s.durationMin} хв
                  </p>
                  <Button
                    className="self-start px-5 py-2"
                    disabled={!canJoin}
                    onClick={() => setJoinedSession(s.id)}
                  >
                    {canJoin ? 'Приєднатись' : 'Кнопка активна за 10 хв до старту'}
                  </Button>
                  {joinedSession === s.id && (
                    <a
                      className="text-blue-600 font-black text-sm inline-flex items-center gap-1"
                      href={s.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Відкрити посилання <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-2xl font-black dark:text-white mb-4">Модулі</h3>
          <ol className="space-y-3">
            {course.modules.map((m, idx) => (
              <li
                key={m.id}
                className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                {m.locked ? (
                  <Lock className="text-slate-400 shrink-0" size={18} />
                ) : (
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                )}
                <div>
                  <p className="text-xs font-black text-slate-400">Модуль {idx + 1}</p>
                  <p className="font-black dark:text-white">{m.title}</p>
                  <p className="text-xs text-slate-500 uppercase mt-1">{m.type}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
