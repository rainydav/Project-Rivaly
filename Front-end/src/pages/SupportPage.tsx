import { useState } from 'react';
import { Card } from '../components/ui';
import { Button } from '../components/ui';
import { Headset, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendSupportMessageApi } from '../lib/supportApi';

export function SupportPage() {
  const { user, pushToast } = useApp();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-4xl font-black dark:text-white">Підтримка</h1>
      </div>
      <Card className="p-8 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-blue-600 font-black">
          <Headset /> Швидка лінія
        </div>
        {!open ? (
          <Button className="self-start px-6 py-3" type="button" onClick={() => setOpen(true)}>
            <Mail size={18} /> Написати в підтримку
          </Button>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const body = message.trim();
              if (!body) return;
              setSending(true);
              try {
                await sendSupportMessageApi(body);
                pushToast('Повідомлення надіслано');
                setMessage('');
                setOpen(false);
              } catch (err) {
                pushToast(err instanceof Error ? err.message : 'Помилка');
              } finally {
                setSending(false);
              }
            }}
          >
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Лист надсилається на <span className="font-mono">tadhakoteam@gmail.com</span>; у полі «Відповідь» буде
              вказано <span className="font-mono">{user.email}</span>.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              minLength={5}
              maxLength={8000}
              placeholder="Опишіть питання…"
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none dark:text-white"
            />
            <div className="flex gap-2 flex-wrap">
              <Button type="submit" disabled={sending} className="px-6 py-3">
                {sending ? 'Надсилання…' : 'Надіслати'}
              </Button>
              <Button type="button" variant="secondary" className="px-6 py-3" onClick={() => setOpen(false)}>
                Скасувати
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
