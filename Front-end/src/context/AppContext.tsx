import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type {
  Course,
  ModerationConfig,
  UserProfile,
  UserRole,
  Gender,
} from '../types';
import { fetchMe, loginApi, logoutApi, registerApi } from '../lib/authApi';
import { patchProfileApi } from '../lib/profileApi';
import { getAccessToken } from '../lib/http';

const THEME_KEY = 'rivaly_dark';

function loadSavedTheme(): boolean {
  try {
    return localStorage.getItem(THEME_KEY) === '1';
  } catch {
    return false;
  }
}

const initialCourses: Course[] = [
  {
    id: 'c1',
    title: 'Web Security Fundamentals',
    description:
      'Модулі з відео, статтями та вбудованими тестами. Прогрес наступного модуля відкривається після успішного тесту.',
    difficulty: 'Середній',
    estimatedHours: 12,
    author: 'Rivaly Academy',
    zoomLink: 'https://zoom.us/j/0000000000',
    gitLink: 'https://github.com/example/course-labs',
    siteLink: 'https://rivaly.example',
    enrolled: false,
    modules: [
      {
        id: 'm1',
        title: 'Вступ: модель загроз',
        type: 'video',
        content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'm2',
        title: 'OWASP Top 10 — конспект',
        type: 'article',
        content:
          '# OWASP\n\nКороткий огляд ризиків для вебзастосунків. Після прочитання пройдіть тест нижче.',
      },
      {
        id: 'm3',
        title: 'Контрольний тест модуля 2',
        type: 'article',
        content:
          'Після вивчення матеріалу пройдіть відповідний тест у розділі «Тести» на платформі.',
      },
      {
        id: 'm4',
        title: 'Практика: XSS та CSRF',
        type: 'article',
        content: 'Практичні сценарії та чеклісти для аудиту.',
      },
    ],
    sessions: [
      {
        id: 's1',
        title: 'Live Q&A з ментором',
        platform: 'Zoom',
        link: 'https://zoom.us/j/0000000000',
        startAt: new Date(Date.now() + 3600_000 * 5).toISOString(),
        durationMin: 60,
      },
    ],
  },
  {
    id: 'c2',
    title: 'Алгоритми та структури даних',
    description: 'Інтенсив для підготовки до турнірів.',
    difficulty: 'Просунутий',
    estimatedHours: 40,
    author: 'Oleksandr K.',
    gitLink: 'https://github.com/example/dsa',
    enrolled: true,
    modules: [
      {
        id: 'd1',
        title: 'Складність O-нотація',
        type: 'video',
        content: 'https://www.youtube.com/embed/oHg5SJYRHA0',
      },
      {
        id: 'd2',
        title: 'Дерева пошуку',
        type: 'article',
        content: 'BST, AVL, червоно-чорні дерева — огляд.',
      },
    ],
    sessions: [],
  },
];

interface AppState {
  isAuth: boolean;
  isDark: boolean;
  user: UserProfile;
  courses: Course[];
  moderation: ModerationConfig;
  bans: Record<string, number>;
  toast: string | null;
  authLoading: boolean;
}

interface AppContextValue extends AppState {
  /** Реєстрація (бекенд /api/auth/register) — без автологіну */
  registerWithApi: (p: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    gender: Gender;
  }) => Promise<{ message: string }>;
  /** Вхід (бекенд /api/auth/login) */
  loginWithApi: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleDark: () => void;
  /** Локальне + PATCH /api/profile/me */
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  setModeration: (m: Partial<ModerationConfig>) => void;
  setBans: Dispatch<SetStateAction<Record<string, number>>>;
  enrollCourse: (courseId: string) => void;
  pushToast: (t: string) => void;
  clearToast: () => void;
  markModuleComplete: (courseId: string, moduleId: string) => void;
  applyServerUser: (u: UserProfile) => void;
}

function defaultTitleForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'organizer':
      return 'Organizer';
    case 'jury':
      return 'Jury';
    default:
      return 'Participant';
  }
}

const defaultUser = (): UserProfile => ({
  id: '',
  name: '',
  email: '',
  role: 'participant',
  gender: 'other',
  avatarUrl: 'https://i.pravatar.cc/200?u=rivaly',
  bio: '',
  title: 'Participant',
  stats: {
    tournamentsJoined: 0,
    coursesCompleted: 0,
    testsPassed: 0,
    testsTaken: 0,
    testPassPercent: 0,
    testBestScore: 0,
    quizBestScore: 0,
    quizSessionsFinished: 0,
  },
});

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [isDark, setIsDark] = useState(loadSavedTheme);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [moderation, setModerationState] = useState<ModerationConfig>({
    bannedWords: ['мат', 'спам', 'telegram'],
    stickerTriggers: [':banned:', ':toxic:'],
    banMinutes: 5,
  });
  const [bans, setBans] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getAccessToken()) {
        setAuthLoading(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        if (me) {
          setUser((u) => ({
            ...u,
            ...me,
            title: me.title || defaultTitleForRole(me.role),
            avatarUrl:
              me.avatarUrl?.trim() ||
              u.avatarUrl ||
              `https://i.pravatar.cc/200?u=${encodeURIComponent(me.id)}`,
            stats: me.stats ?? u.stats ?? defaultUser().stats,
          }));
          setIsAuth(true);
        }
      } catch {
        /* токен протух — ігноруємо, користувач залогіниться знову */
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pushToast = useCallback((t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const registerWithApi = useCallback(
    async (p: {
      username: string;
      email: string;
      password: string;
      fullName?: string;
      gender: Gender;
    }) => {
      return registerApi(p);
    },
    []
  );

  const loginWithApi = useCallback(async (email: string, password: string) => {
    const { user: u } = await loginApi(email, password);
    setUser({
      ...u,
      title: u.title || defaultTitleForRole(u.role),
      avatarUrl:
        u.avatarUrl?.trim() ||
        `https://i.pravatar.cc/200?u=${encodeURIComponent(u.id)}`,
      stats: u.stats ?? defaultUser().stats,
    });
    setIsAuth(true);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setIsAuth(false);
    setUser(defaultUser());
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((d) => {
      const next = !d;
      try {
        localStorage.setItem(THEME_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const hasServerFields =
        patch.name !== undefined ||
        patch.bio !== undefined ||
        patch.title !== undefined ||
        patch.avatarUrl !== undefined ||
        patch.gender !== undefined ||
        patch.username !== undefined;

      if (hasServerFields && getAccessToken()) {
        try {
          const updated = await patchProfileApi(patch);
          setUser((u) => ({
            ...u,
            ...updated,
            title: updated.title || defaultTitleForRole(updated.role),
            avatarUrl:
              updated.avatarUrl?.trim() ||
              `https://i.pravatar.cc/200?u=${encodeURIComponent(updated.id)}`,
            stats: updated.stats ?? u.stats ?? defaultUser().stats,
          }));
          pushToast('Профіль збережено на сервері.');
        } catch (e) {
          throw e;
        }
      } else {
        setUser((u) => ({ ...u, ...patch }));
      }
    },
    [pushToast]
  );

  const setModeration = useCallback((m: Partial<ModerationConfig>) => {
    setModerationState((prev) => ({ ...prev, ...m }));
  }, []);

  const enrollCourse = useCallback(
    (courseId: string) => {
      setCourses((list) =>
        list.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c))
      );
      pushToast('Ви успішно записались на курс.');
    },
    [pushToast]
  );

  const markModuleComplete = useCallback((courseId: string, moduleId: string) => {
    setCourses((list) =>
      list.map((c) => {
        if (c.id !== courseId) return c;
        const idx = c.modules.findIndex((m) => m.id === moduleId);
        const next = c.modules.map((m, i) => ({
          ...m,
          locked: i > idx ? m.locked : false,
        }));
        return { ...c, modules: next };
      })
    );
  }, []);

  const applyServerUser = useCallback((next: UserProfile) => {
    setUser((u) => ({
      ...u,
      ...next,
      title: next.title || defaultTitleForRole(next.role),
      avatarUrl:
        next.avatarUrl?.trim() ||
        `https://i.pravatar.cc/200?u=${encodeURIComponent(next.id)}`,
      stats: next.stats ?? u.stats ?? defaultUser().stats,
    }));
  }, []);

  useEffect(() => {
    const onUserRefreshed = (ev: Event) => {
      const detail = (ev as CustomEvent<UserProfile>).detail;
      if (detail?.id) applyServerUser(detail);
    };
    window.addEventListener('rivaly:user-refreshed', onUserRefreshed);
    return () => window.removeEventListener('rivaly:user-refreshed', onUserRefreshed);
  }, [applyServerUser]);

  const value = useMemo<AppContextValue>(
    () => ({
      isAuth,
      isDark,
      user,
      courses,
      moderation,
      bans,
      toast,
      authLoading,
      registerWithApi,
      loginWithApi,
      logout,
      toggleDark,
      updateProfile,
      setModeration,
      setBans,
      enrollCourse,
      pushToast,
      clearToast: () => setToast(null),
      markModuleComplete,
      applyServerUser,
    }),
    [
      authLoading,
      bans,
      courses,
      isAuth,
      isDark,
      loginWithApi,
      logout,
      markModuleComplete,
      applyServerUser,
      moderation,
      registerWithApi,
      enrollCourse,
      pushToast,
      toast,
      toggleDark,
      updateProfile,
      setModeration,
      setBans,
      user,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function roleLabel(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'Адміністратор';
    case 'organizer':
      return 'Організатор / Вчитель';
    case 'jury':
      return 'Журі';
    default:
      return 'Учасник';
  }
}
