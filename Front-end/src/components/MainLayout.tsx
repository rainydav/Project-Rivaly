import { useLayoutEffect, useEffect, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Headset,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  PlusCircle,
  Scale,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trophy,
  Users,
} from 'lucide-react';
import { useApp, roleLabel } from '../context/AppContext';
import { ThemeToggleButton } from './ThemeToggleButton';
import type { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles?: UserRole[];
}

const SEARCHABLE_PATHS = new Set(['/dashboard', '/tests', '/tournaments', '/quizzes']);

function searchPlaceholder(pathname: string): string {
  if (pathname === '/dashboard') return 'Пошук користувачів (імʼя, email, @нік)…';
  if (pathname === '/tests') return 'Пошук тестів за назвою…';
  if (pathname === '/tournaments') return 'Пошук турнірів за назвою…';
  if (pathname === '/quizzes') return 'Пошук вікторин за назвою…';
  return 'Пошук…';
}

function navIsActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/dashboard') return pathname === '/dashboard';
  if (itemPath === '/admin-console') {
    return pathname === '/admin-console' || pathname.startsWith('/admin-console/');
  }
  if (itemPath === '/admin') {
    if (pathname.startsWith('/admin-console')) return false;
    return pathname === '/admin' || pathname.startsWith('/admin/');
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

const HEADER_AVATAR_FALLBACK = 'https://i.pravatar.cc/200?u=rivaly-header';

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, toggleDark, isDark, logout, toast, clearToast } = useApp();
  const [headerSearch, setHeaderSearch] = useState('');

  useEffect(() => {
    if (!SEARCHABLE_PATHS.has(location.pathname)) {
      setHeaderSearch('');
      return;
    }
    const q = new URLSearchParams(location.search);
    setHeaderSearch(q.get('search') || '');
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const navItems: NavItem[] = [
    { label: 'Дашборд', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Турніри', path: '/tournaments', icon: <Trophy size={20} /> },
    { label: 'Тести', path: '/tests', icon: <ClipboardList size={20} /> },
    { label: 'Вікторини', path: '/quizzes', icon: <Sparkles size={20} /> },
    { label: 'Навчання', path: '/learning', icon: <BookOpen size={20} /> },
    { label: 'Чат', path: '/chat', icon: <MessageCircle size={20} /> },
    { label: 'Рейтинг', path: '/leaderboard', icon: <BarChart3 size={20} /> },
    { label: 'Оцінювання', path: '/jury', icon: <Scale size={20} />, roles: ['jury'] },
    { label: 'Профіль', path: '/profile', icon: <Users size={20} /> },
    { label: 'Підтримка', path: '/support', icon: <Headset size={20} /> },
    { label: 'Налаштування', path: '/settings', icon: <Settings size={20} /> },
    {
      label: 'Адмін',
      path: '/admin-console',
      icon: <Shield size={20} />,
      roles: ['admin'],
    },
  ];

  const filtered = navItems.filter(
    (n) => !n.roles || n.roles.includes(user.role)
  );

  const canCreate = user.role === 'admin' || user.role === 'organizer';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <aside className="w-72 fixed h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-8 flex flex-col z-50">
        <Link to="/dashboard" className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl">
            R
          </div>
          <span className="text-3xl font-black dark:text-white tracking-tighter">
            Rivaly
          </span>
        </Link>

        {canCreate && (
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl mb-8 transition-all font-black shadow-lg shadow-emerald-500/20 active:scale-95 text-center"
          >
            <PlusCircle size={20} /> <span>Конструктор</span>
          </Link>
        )}

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {filtered.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${
                navIsActive(location.pathname, item.path)
                  ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg'
                  : 'text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon} <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-100 dark:border-slate-800 space-y-2 text-xs font-bold text-slate-500">
          Роль: {roleLabel(user.role)}
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3 mt-2">
          <button
            type="button"
            onClick={toggleDark}
            className="w-full flex items-center gap-4 p-3 text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all font-bold"
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
            <span className="text-sm">{isDark ? 'Світла тема' : 'Темна тема'}</span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center gap-4 p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all font-bold"
          >
            <LogOut size={20} /> <span className="text-sm">Вийти</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 min-h-screen">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10">
          {SEARCHABLE_PATHS.has(location.pathname) ? (
            <form
              className="relative w-full lg:w-1/3"
              onSubmit={(e) => {
                e.preventDefault();
                const q = headerSearch.trim();
                const base = location.pathname;
                navigate(q ? `${base}?search=${encodeURIComponent(q)}` : base);
              }}
            >
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="search"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder={searchPlaceholder(location.pathname)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl py-4 pl-14 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white text-slate-900"
              />
            </form>
          ) : (
            <div className="w-full lg:w-1/3" />
          )}
          <div className="flex items-center gap-4 justify-end">
            <ThemeToggleButton />
            <button
              type="button"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 text-gray-400 hover:shadow-lg transition-all relative"
            >
              <Bell size={22} />
              <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>
            <Link
              to="/profile"
              className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pr-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={user.avatarUrl?.trim() || HEADER_AVATAR_FALLBACK}
                className="w-12 h-12 rounded-2xl object-cover"
                alt="avatar"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-black dark:text-white leading-none">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-500 font-black mt-1 uppercase tracking-tighter">
                  {user.title}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {toast && (
          <div className="fixed bottom-8 right-8 z-[100] max-w-sm">
            <button
              type="button"
              onClick={clearToast}
              className="w-full text-left bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl font-bold border border-white/10"
            >
              {toast}
            </button>
          </div>
        )}

        <div className="animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
