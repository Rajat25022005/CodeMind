import { useNavigate, useLocation } from 'react-router-dom';
import './GraphTabBar.css';

const graphTabs = [
  { label: 'Knowledge Graph', color: 'var(--cyan)', id: 'knowledge-graph', path: '/' },
  { label: 'Decision Trail', color: 'var(--amber)', id: 'decision-trail', path: '/query' },
  { label: 'Diff Viewer', color: 'var(--green)', id: 'diff-viewer', path: '/diff' },
  { label: 'Onboarding', color: 'var(--purple)', id: 'onboarding', path: '/onboarding' },
];

const GraphTabBar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (tab: typeof graphTabs[0]) => {
    if (tab.path === '/') {
      onTabChange(tab.id);
    } else {
      navigate(tab.path);
    }
  };

  const getIsActive = (tab: typeof graphTabs[0]) => {
    if (tab.path === '/') return location.pathname === '/' && activeTab === tab.id;
    return location.pathname === tab.path;
  };

  return (
    <div className="tabbar" role="tablist">
      {graphTabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${getIsActive(tab) ? 'active' : ''}`}
          role="tab"
          aria-selected={getIsActive(tab)}
          onClick={() => handleTabClick(tab)}
        >
          <span className="tabDot" style={{ background: tab.color }} />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default GraphTabBar;
