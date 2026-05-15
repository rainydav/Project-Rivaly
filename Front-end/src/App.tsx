import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './components/MainLayout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { CoursePlayerPage } from './pages/CoursePlayerPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ChatPage } from './pages/ChatPage';
import { SupportPage } from './pages/SupportPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { TestsPage } from './pages/TestsPage';
import { AdminHubPage } from './pages/AdminHubPage';
import { AdminTournamentPage } from './pages/AdminTournamentPage';
import { AdminTestPage } from './pages/AdminTestPage';
import { AdminQuizPage } from './pages/AdminQuizPage';
import { AdminCoursePage } from './pages/AdminCoursePage';
import { AdminConsolePage } from './pages/AdminConsolePage';
import { TestTakePage } from './pages/TestTakePage';
import { QuizCompetitivePage } from './pages/QuizCompetitivePage';
import { QuizzesPage } from './pages/QuizzesPage';
import { JuryAssignmentsPage } from './pages/JuryAssignmentsPage';
import { TournamentPlayPage } from './pages/TournamentPlayPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import type { UserRole } from './types';

function AuthRequired() {
  const { isAuth, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold">
        Завантаження сесії…
      </div>
    );
  }
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { isAuth, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold">
        Завантаження…
      </div>
    );
  }
  if (isAuth) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function RoleGate({ allow }: { allow: UserRole[] }) {
  const { user, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500 font-bold">
        Завантаження…
      </div>
    );
  }
  if (!allow.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function RootRedirect() {
  const { isAuth, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold">
        Завантаження…
      </div>
    );
  }
  return <Navigate to={isAuth ? '/dashboard' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route element={<AuthRequired />}>
        <Route path="/tests/take/:id" element={<TestTakePage />} />
        <Route path="/quiz/live/:id" element={<QuizCompetitivePage />} />

        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/users/:id" element={<PublicProfilePage />} />
          <Route path="/learning" element={<CoursesPage />} />
          <Route path="/learning/:id" element={<CourseDetailPage />} />
          <Route path="/learning/:id/player" element={<CoursePlayerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/support" element={<SupportPage />} />

          <Route path="/leaderboard" element={<LeaderboardPage />} />

          <Route element={<RoleGate allow={['jury']} />}>
            <Route path="/jury" element={<JuryAssignmentsPage />} />
          </Route>

          <Route element={<RoleGate allow={['organizer', 'admin']} />}>
            <Route path="/admin" element={<AdminHubPage />} />
            <Route path="/admin/tournament" element={<AdminTournamentPage />} />
            <Route path="/admin/test" element={<AdminTestPage />} />
            <Route path="/admin/quiz" element={<AdminQuizPage />} />
            <Route path="/admin/course" element={<AdminCoursePage />} />
          </Route>

          <Route element={<RoleGate allow={['admin']} />}>
            <Route path="/admin-console" element={<AdminConsolePage />} />
          </Route>

          <Route path="/tournaments/play/:id" element={<TournamentPlayPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 min-h-screen">
        <AppRoutes />
      </div>
    </AppProvider>
  );
}
