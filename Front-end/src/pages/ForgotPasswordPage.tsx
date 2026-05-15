import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../lib/authApi';
import { Button } from '../components/ui';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800 p-10">
        <h1 className="text-3xl font-black dark:text-white mb-2">Забув пароль</h1>
        <p className="text-slate-500 text-sm mb-6">
          Введіть email акаунта. Якщо користувач існує, на пошту буде надіслано посилання для скидання.
        </p>
        {err && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 text-sm font-bold">
            {err}
          </div>
        )}
        {done ? (
          <p className="text-emerald-600 font-bold text-sm mb-6">
            Якщо email зареєстровано, лист надіслано. Перевірте поштову скриньку.
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr(null);
              setLoading(true);
              try {
                await forgotPasswordApi(email.trim());
                setDone(true);
              } catch (e2) {
                setErr(e2 instanceof Error ? e2.message : 'Помилка');
              } finally {
                setLoading(false);
              }
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
            />
            <Button type="submit" disabled={loading} className="w-full py-3 rounded-2xl">
              {loading ? 'Надсилання…' : 'Надіслати посилання'}
            </Button>
          </form>
        )}
        <Link to="/login" className="block text-center text-sm font-bold text-blue-600 mt-6 hover:underline">
          Повернутись до входу
        </Link>
      </div>
    </div>
  );
}
