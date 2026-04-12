import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import WorkspaceLayout from './components/layout/WorkspaceLayout';

// Lazy-loaded pages for code splitting — each page is a separate chunk
const GraphPage = lazy(() => import('./pages/GraphPage'));
const DecisionTrailPage = lazy(() => import('./pages/DecisionTrailPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const FilesPage = lazy(() => import('./pages/FilesPage'));
const CommitsPage = lazy(() => import('./pages/CommitsPage'));
const DiffViewerPage = lazy(() => import('./pages/DiffViewerPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', width: '100%',
    fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)',
  }}>
    Loading…
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => !!s.token);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        
        <Route element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
          <Route path="/" element={<GraphPage />} />
          <Route path="/query" element={<DecisionTrailPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/commits" element={<CommitsPage />} />
          <Route path="/diff" element={<DiffViewerPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
