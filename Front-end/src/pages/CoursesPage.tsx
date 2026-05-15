import { Link } from 'react-router-dom';
import { Clock, ExternalLink, Github, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, Button, Card } from '../components/ui';

export function CoursesPage() {
  const { courses } = useApp();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-5xl font-black dark:text-white tracking-tight">Навчання</h1>
        <p className="text-gray-400 font-bold mt-2 text-lg">
          Курси з модулями, живими зустрічами та прогресом.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {courses.map((c) => (
          <Card key={c.id} className="p-8 flex flex-col gap-6">
            <div className="flex justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-2xl font-black dark:text-white">{c.title}</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">{c.description}</p>
              </div>
              <Badge variant="orange">{c.difficulty}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock size={14} /> ~{c.estimatedHours} год
              </span>
              <span>Автор: {c.author}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.zoomLink && (
                <a
                  href={c.zoomLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 font-black text-sm"
                >
                  <Video size={16} /> Zoom
                </a>
              )}
              {c.gitLink && (
                <a
                  href={c.gitLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 font-black text-sm"
                >
                  <Github size={16} /> GitHub
                </a>
              )}
              {c.siteLink && (
                <a
                  href={c.siteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 font-black text-sm"
                >
                  <ExternalLink size={16} /> Сайт
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-auto">
              <Link to={`/learning/${c.id}`} className="inline-flex">
                <Button className="px-6 py-3">
                  {c.enrolled ? 'Продовжити' : 'Деталі та запис'}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
