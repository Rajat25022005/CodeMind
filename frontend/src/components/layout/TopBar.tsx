import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { mockDriftItems } from '../../data/mockData';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const { toggleDrift } = useApp();

  return (
    <header className="topbar">
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="logoIcon">🧠</div>
        CodeMind
      </div>
      <div className="repoBadge">nexus-workplace / main · 2,847 commits</div>
      <span className="separator">|</span>
      <span className="pill pillCyan">⚡ Indexed</span>
      <div className="topbarRight">
        <span className="pill pillAmber" onClick={toggleDrift} style={{ cursor: 'pointer' }}>
          ⚠ {mockDriftItems.length} Drifts
        </span>
        <div className="navIcon" title="Settings">⚙</div>
        <div className="navIcon" title="User">👤</div>
      </div>
    </header>
  );
};

export default TopBar;
