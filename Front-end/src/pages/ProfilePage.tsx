import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/ui';

export function ProfilePage() {
  const { user, updateProfile, pushToast } = useApp();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || '');
  const [title, setTitle] = useState(user.title);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setUsername(user.username || '');
    setTitle(user.title);
    setBio(user.bio);
    setAvatarUrl(user.avatarUrl);
  }, [user.name, user.username, user.title, user.bio, user.avatarUrl]);

  return (
    <div className="flex flex-col xl:flex-row gap-10">
      <div className="w-full xl:w-1/3">
        <Card className="p-10 text-center">
          <div className="relative w-40 h-40 mx-auto mb-6">
            <img
              src={avatarUrl?.trim() || 'https://i.pravatar.cc/200?u=profile'}
              className="w-full h-full rounded-[40px] object-cover ring-8 ring-blue-50 dark:ring-blue-900/20"
              alt="profile"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-12 h-12 rounded-2xl border-4 border-white dark:border-slate-900 flex items-center justify-center text-white">
              <CheckCircle size={24} />
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result || '');
                if (dataUrl.length > 400000) {
                  pushToast('Зображення завелике. Оберіть менший файл.');
                  return;
                }
                setAvatarUrl(dataUrl);
              };
              reader.readAsDataURL(f);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="mb-4 w-full py-3"
            onClick={() => fileRef.current?.click()}
          >
            Змінити фото
          </Button>
          <h2 className="text-3xl font-black dark:text-white mb-1">{name}</h2>
          <p className="text-gray-400 font-bold mb-1">{title}</p>
          {username.trim() && (
            <p className="text-sm text-slate-500 font-mono mb-4">@{username.trim()}</p>
          )}
          {!username.trim() && <div className="mb-4" />}
          <Link
            to={`/users/${user.id}`}
            className="text-sm font-bold text-blue-600 hover:underline mb-6 inline-block"
          >
            Як вас бачать інші
          </Link>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-gray-50 dark:border-slate-800">
            <div>
              <p className="text-2xl font-black dark:text-white">
                {user.stats?.tournamentsJoined ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-black">Турніри</p>
            </div>
            <div>
              <p className="text-2xl font-black dark:text-white">
                {user.stats?.testsTaken ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-black">Тестів</p>
              <p className="text-xs text-slate-500 font-bold mt-1">
                {user.stats?.testsTaken ?? 0} пройдено · {user.stats?.testPassPercent ?? 0}% ·{' '}
                {user.stats?.testBestScore ?? 0} б.
              </p>
            </div>
            <div>
              <p className="text-2xl font-black dark:text-white">
                {user.stats?.quizSessionsFinished ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-black">Вікторин</p>
              <p className="text-xs text-slate-500 font-bold mt-1">
                рекорд {user.stats?.quizBestScore ?? 0} б.
              </p>
            </div>
            <div>
              <p className="text-2xl font-black dark:text-white">
                {user.stats?.coursesCompleted ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-black">Курси</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="flex-1 space-y-6">
        <Card className="p-10">
          <h3 className="text-3xl font-black dark:text-white mb-6">Редагувати профіль</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                Нікнейм (латиниця, цифри, _)
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white font-mono"
                placeholder="rivaly_user"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                Імʼя
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                Посада / роль у команді
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
              />
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">Біо</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
            />
          </div>
          <Button
            className="mt-6 px-8 py-3"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await updateProfile({
                  name,
                  username: username.trim(),
                  title,
                  bio,
                  avatarUrl,
                });
              } catch (e) {
                pushToast(e instanceof Error ? e.message : 'Не вдалося зберегти');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Збереження…' : 'Зберегти зміни'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
