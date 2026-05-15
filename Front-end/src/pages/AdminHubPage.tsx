import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardList, GraduationCap, Trophy } from 'lucide-react';
import { Card } from '../components/ui';

const tiles = [
  {
    to: '/admin/tournament',
    title: 'Турнір',
    icon: <Trophy className="text-amber-400" />,
  },
  {
    to: '/admin/test',
    title: 'Тест (Unstop)',
    icon: <ClipboardList className="text-blue-400" />,
  },
  {
    to: '/admin/quiz',
    title: 'Вікторина',
    icon: <CalendarClock className="text-indigo-400" />,
  },
  {
    to: '/admin/course',
    title: 'Курс',
    icon: <GraduationCap className="text-emerald-400" />,
  },
];

export function AdminHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black dark:text-white">Конструктор</h1>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="p-8 h-full hover:shadow-2xl transition-all border border-transparent hover:border-blue-500/30">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                {t.icon}
              </div>
              <h3 className="text-xl font-black dark:text-white">{t.title}</h3>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
