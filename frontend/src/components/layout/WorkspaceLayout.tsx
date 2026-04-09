import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomStrip from './BottomStrip';
import DriftAlerts from '../DriftAlerts';
import './WorkspaceLayout.css';

const WorkspaceLayout = () => {
  const { driftOpen, setDriftOpen } = useApp();

  return (
    <>
      <TopBar />
      <div className="workspace">
        <Sidebar />
        <Outlet />
        {driftOpen && <DriftAlerts onClose={() => setDriftOpen(false)} />}
      </div>
      <BottomStrip />
    </>
  );
};

export default WorkspaceLayout;
