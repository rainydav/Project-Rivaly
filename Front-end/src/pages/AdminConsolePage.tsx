import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../components/ui';
import type { UserProfile, UserRole } from '../types';
import { useApp, roleLabel } from '../context/AppContext';
import { fetchMe } from '../lib/authApi';
import { deleteUserApi, fetchAllUsersApi, updateUserRoleApi } from '../lib/usersApi';

const ROLES: UserRole[] = ['participant', 'organizer', 'jury', 'admin'];

export function AdminConsolePage() {
  const { user, pushToast, applyServerUser } = useApp();
  const [rows, setRows] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllUsersApi();
      setRows(list);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black dark:text-white">Адмін-консоль</h1>
      </div>

      {loading ? (
        <p className="text-slate-500 font-bold">Завантаження…</p>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left">
                <tr>
                  <th className="p-4 font-black">Користувач</th>
                  <th className="p-4 font-black">Email</th>
                  <th className="p-4 font-black">Роль</th>
                  <th className="p-4 font-black">Дії</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-4">
                      <Link className="font-bold text-blue-600 hover:underline" to={`/users/${u.id}`}>
                        {u.name}
                      </Link>
                      {u.username && (
                        <span className="block text-xs text-slate-400 font-mono">@{u.username}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <select
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 font-bold dark:text-white"
                        value={u.role}
                        onChange={async (e) => {
                          const role = e.target.value as UserRole;
                          try {
                            const updated = await updateUserRoleApi(u.id, role);
                            setRows((list) => list.map((x) => (x.id === u.id ? { ...x, ...updated } : x)));
                            if (u.id === user.id) {
                              const me = await fetchMe();
                              if (me) applyServerUser(me);
                            }
                            pushToast('Роль оновлено');
                          } catch (ex) {
                            pushToast(ex instanceof Error ? ex.message : 'Помилка');
                            void reload();
                          }
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                      {u.isVerified === false && (
                        <Badge variant="orange" className="ml-2">
                          email не підтверджено
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="secondary"
                        className="text-red-600 border-red-200"
                        disabled={u.id === user.id}
                        onClick={async () => {
                          if (!confirm(`Видалити користувача ${u.email}?`)) return;
                          try {
                            await deleteUserApi(u.id);
                            pushToast('Видалено');
                            void reload();
                          } catch (ex) {
                            pushToast(ex instanceof Error ? ex.message : 'Помилка');
                          }
                        }}
                      >
                        Видалити
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
