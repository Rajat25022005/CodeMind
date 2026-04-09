import { Routes, Route } from 'react-router-dom';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import GraphPage from './pages/GraphPage';
import DecisionTrailPage from './pages/DecisionTrailPage';
import TimelinePage from './pages/TimelinePage';
import FilesPage from './pages/FilesPage';
import CommitsPage from './pages/CommitsPage';
import DiffViewerPage from './pages/DiffViewerPage';
import OnboardingPage from './pages/OnboardingPage';

function App() {
  return (
    <Routes>
      <Route element={<WorkspaceLayout />}>
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
