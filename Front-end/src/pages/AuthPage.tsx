import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Gender } from '../types';
import { Button } from '../components/ui';

type AuthMode = 'register' | 'login';

/**
 * Єдине вікно входу та реєстрації. Роль облікового запису визначається в базі даних.
 */
export function AuthPage() {
  const { registerWithApi, loginWithApi, pushToast } = useApp();
  const [gender, setGender] = useState<Gender>('other');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-slate-100 dark:border-slate-800 min-h-[560px]">
        <div className="hidden lg:flex lg:w-[45%] p-12 xl:p-16 bg-blue-600 text-white flex-col justify-between relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl font-black mb-8 italic">
              R
            </div>
            <h1 className="text-5xl xl:text-6xl font-black mb-4 leading-[1.05] tracking-tighter">
              Створи <br /> своє майбутнє.
            </h1>
          </div>
          <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] bg-blue-400 rounded-full blur-[100px] opacity-30" />
        </div>

        <div className="w-full flex-1 p-8 lg:p-12 xl:p-14 flex flex-col justify-center min-w-0">
          <h2 className="text-3xl lg:text-4xl font-black mb-6 dark:text-white tracking-tight">
            {authMode === 'register' ? 'Реєстрація' : 'Вхід'}
          </h2>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setFormError(null);
              }}
              className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Увійти
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setFormError(null);
              }}
              className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${
                authMode === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Реєстрація
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm font-bold">
              {formError}
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError(null);
              const fd = new FormData(e.currentTarget);
              const email = String(fd.get('email') || '');
              const password = String(fd.get('password') || '');
              setSubmitting(true);
              try {
                if (authMode === 'login') {
                  await loginWithApi(email, password);
                  pushToast('Вітаємо!');
                } else {
                  const username = String(fd.get('username') || '').trim();
                  const msg = await registerWithApi({
                    username,
                    email,
                    password,
                    fullName: String(fd.get('name') || '').trim(),
                    gender,
                  });
                  pushToast(
                    `${msg.message} Перевірте пошту та підтвердіть email — без підтвердження обліковий запис може залишатися неактивним.`
                  );
                  setAuthMode('login');
                }
              } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Помилка мережі');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-black dark:text-white mb-2 uppercase tracking-widest">
                    Username
                  </label>
                  <input
                    name="username"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[a-zA-Z0-9_]+"
                    title="Латиниця, цифри та підкреслення"
                    placeholder="rivaly_user"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black dark:text-white mb-2 uppercase tracking-widest">
                    Імʼя
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Ваше імʼя"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black dark:text-white mb-2 uppercase tracking-widest">
                    Стать
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 outline-none dark:text-white"
                  >
                    <option value="male">Чоловіча</option>
                    <option value="female">Жіноча</option>
                    <option value="other">Інше / не вказувати</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-black dark:text-white mb-2 uppercase tracking-widest">
                Електронна пошта
              </label>
              <input
                name="email"
                required
                type="email"
                placeholder="email@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-black dark:text-white mb-2 uppercase tracking-widest">
                Пароль
              </label>
              <input
                name="password"
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white"
              />
            </div>
            {authMode === 'login' && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm font-bold text-blue-600 hover:underline">
                  Забув пароль
                </Link>
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full py-4 text-lg rounded-[22px]">
              {submitting ? 'Зачекайте…' : authMode === 'register' ? 'Створити акаунт' : 'Увійти'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
