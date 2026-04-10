import { Outlet } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomStrip from './BottomStrip';
import DriftAlerts from '../DriftAlerts';
import ErrorBoundary from '../ErrorBoundary';
import './WorkspaceLayout.css';

const WorkspaceLayout = () => {
  const driftOpen = useUIStore((s) => s.driftOpen);
  const setDriftOpen = useUIStore((s) => s.setDriftOpen);

  return (
    <>
      <TopBar />
      <div className="workspace">
        <Sidebar />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        {driftOpen && <DriftAlerts onClose={() => setDriftOpen(false)} />}
      </div>
      <BottomStrip />
    </>
  );
};

export default WorkspaceLayout;
