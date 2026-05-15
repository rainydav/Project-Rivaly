import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmailRequest } from '../lib/authApi';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [text, setText] = useState<string>('Перевірка…');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!token) {
      setText('Немає токена в посиланні.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const body = await verifyEmailRequest(token);
        if (cancelled) return;
        setText(body);
        setOk(body.toLowerCase().includes('success'));
      } catch {
        if (!cancelled) setText('Не вдалося звернутися до сервера.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800 p-10 text-center">
        <h1 className="text-3xl font-black dark:text-white mb-4">Підтвердження email</h1>
        <p className={`text-sm font-bold whitespace-pre-wrap ${ok ? 'text-emerald-600' : 'text-slate-600'}`}>
          {text}
        </p>
        <Link
          to="/login"
          className="inline-block mt-8 text-sm font-black text-blue-600 hover:underline"
        >
          Перейти до входу
        </Link>
      </div>
    </div>
  );
}
