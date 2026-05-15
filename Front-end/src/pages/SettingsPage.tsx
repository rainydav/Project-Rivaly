import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/ui';

export function SettingsPage() {
  const { user, moderation, setModeration } = useApp();
  const [words, setWords] = useState(moderation.bannedWords.join(', '));
  const [stickers, setStickers] = useState(moderation.stickerTriggers.join(', '));
  const [minutes, setMinutes] = useState(moderation.banMinutes);

  const canModerate = user.role === 'admin' || user.role === 'organizer';

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-4xl font-black dark:text-white">Налаштування</h1>
      </div>
      {canModerate ? (
        <Card className="p-8 space-y-5">
          <h2 className="text-lg font-black dark:text-white">Модерація чату</h2>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Заборонені слова (через кому)
            </label>
            <textarea
              value={words}
              onChange={(e) => setWords(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white min-h-[100px]"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Тригери стікерів (фрази в повідомленні)
            </label>
            <input
              value={stickers}
              onChange={(e) => setStickers(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Тривалість бану (хв)
            </label>
            <input
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white max-w-xs"
            />
          </div>
          <Button
            className="px-6 py-3"
            onClick={() =>
              setModeration({
                bannedWords: words
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                stickerTriggers: stickers
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                banMinutes: minutes,
              })
            }
          >
            Зберегти модерацію
          </Button>
        </Card>
      ) : (
        <Card className="p-8">
          <p className="font-bold text-slate-600 dark:text-slate-300">Немає додаткових налаштувань для вашої ролі.</p>
        </Card>
      )}
    </div>
  );
}
