import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import GraphPage from './pages/GraphPage';
import DecisionTrailPage from './pages/DecisionTrailPage';
import TimelinePage from './pages/TimelinePage';
import FilesPage from './pages/FilesPage';
import CommitsPage from './pages/CommitsPage';
import DiffViewerPage from './pages/DiffViewerPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
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
  );
}

export default App;

