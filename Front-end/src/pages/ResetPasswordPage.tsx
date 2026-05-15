import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordApi } from '../lib/authApi';
import { Button } from '../components/ui';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800 p-10">
        <h1 className="text-3xl font-black dark:text-white mb-2">Новий пароль</h1>
        {!token ? (
          <p className="text-red-600 font-bold text-sm">Посилання не містить токен. Спробуйте лист із пошти ще раз.</p>
        ) : ok ? (
          <p className="text-emerald-600 font-bold">Пароль оновлено. Можете увійти.</p>
        ) : (
          <form
            className="space-y-4 mt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr(null);
              if (password.length < 6) {
                setErr('Пароль має бути не коротший за 6 символів');
                return;
              }
              if (password !== password2) {
                setErr('Паролі не збігаються');
                return;
              }
              setLoading(true);
              try {
                await resetPasswordApi(token, password);
                setOk(true);
              } catch (e2) {
                setErr(e2 instanceof Error ? e2.message : 'Помилка');
              } finally {
                setLoading(false);
              }
            }}
          >
            {err && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 text-sm font-bold">
                {err}
              </div>
            )}
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Новий пароль"
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
            />
            <input
              type="password"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Повторіть пароль"
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
            />
            <Button type="submit" disabled={loading} className="w-full py-3 rounded-2xl">
              {loading ? 'Збереження…' : 'Зберегти пароль'}
            </Button>
          </form>
        )}
        <Link to="/login" className="block text-center text-sm font-bold text-blue-600 mt-6 hover:underline">
          До входу
        </Link>
      </div>
    </div>
  );
}
