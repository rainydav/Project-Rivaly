import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Card } from '../components/ui';

type Mod = { title: string; type: 'video' | 'article' | 'quiz' };

export function AdminCoursePage() {
  const [title, setTitle] = useState('Новий курс');
  const [difficulty, setDifficulty] = useState('Середній');
  const [modules, setModules] = useState<Mod[]>([
    { title: 'Вступне відео', type: 'video' },
    { title: 'Теорія', type: 'article' },
  ]);

  return (
    <div className="space-y-8 max-w-5xl">
      <h1 className="text-4xl font-black dark:text-white">Курс — конструктор</h1>
      <Card className="p-8 grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500">Назва</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500">Складність</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-bold"
          >
            <option>Початковий</option>
            <option>Середній</option>
            <option>Просунутий</option>
          </select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-black uppercase text-slate-500">Короткий опис</label>
          <textarea
            rows={3}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
          />
        </div>
      </Card>

      <Card className="p-8 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black dark:text-white">Модулі</h3>
          <Button
            variant="secondary"
            className="px-4 py-2 text-sm"
            onClick={() => setModules((m) => [...m, { title: 'Новий модуль', type: 'article' }])}
          >
            <Plus size={16} /> Додати
          </Button>
        </div>
        <div className="space-y-3">
          {modules.map((mod, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row gap-3 md:items-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
            >
              <input
                value={mod.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setModules((ms) => ms.map((x, idx) => (idx === i ? { ...x, title: v } : x)));
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none dark:text-white font-bold"
              />
              <select
                value={mod.type}
                onChange={(e) => {
                  const t = e.target.value as Mod['type'];
                  setModules((ms) => ms.map((x, idx) => (idx === i ? { ...x, type: t } : x)));
                }}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 outline-none dark:text-white font-bold"
              >
                <option value="video">Відео</option>
                <option value="article">Стаття</option>
                <option value="quiz">Тест</option>
              </select>
              <Button variant="ghost" className="text-xs px-3 py-2">
                Привʼязати тест
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-8 space-y-4">
        <h3 className="text-xl font-black dark:text-white">Жива лекція</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Назва зустрічі"
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 outline-none dark:text-white"
          />
          <select className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 outline-none dark:text-white font-bold">
            <option>Zoom</option>
            <option>Meet</option>
            <option>Інше</option>
          </select>
          <input
            type="datetime-local"
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 outline-none dark:text-white"
          />
          <input
            type="number"
            placeholder="Тривалість (хв)"
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 outline-none dark:text-white"
          />
        </div>
      </Card>
    </div>
  );
}
