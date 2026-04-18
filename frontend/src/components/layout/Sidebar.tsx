import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { mockDriftItems } from '../../data/mockData';
import './Sidebar.css';

const navItems = [
  {
    id: 'graph',
    title: 'Knowledge Graph',
    path: '/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="3" />
        <circle cx="5" cy="19" r="3" />
        <circle cx="19" cy="19" r="3" />
        <line x1="12" y1="8" x2="5" y2="16" />
        <line x1="12" y1="8" x2="19" y2="16" />
      </svg>
    ),
  },
  {
    id: 'query',
    title: 'Decision Trail',
    path: '/query',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'timeline',
    title: 'Timeline',
    path: '/timeline',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const secondaryItems = [
  {
    id: 'files',
    title: 'Files',
    path: '/files',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'commits',
    title: 'Commits',
    path: '/commits',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <line x1="1.05" y1="12" x2="7" y2="12" />
        <line x1="17.01" y1="12" x2="22.96" y2="12" />
      </svg>
    ),
  },
  {
    id: 'diff',
    title: 'Diff Viewer',
    path: '/diff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    path: '/onboarding',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleDrift } = useApp();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sbSection">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sbBtn ${isActive(item.path) ? 'active' : ''}`}
            title={item.title}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="sbDivider" />

      <div className="sbSection">
        {secondaryItems.map((item) => (
          <button
            key={item.id}
            className={`sbBtn ${isActive(item.path) ? 'active' : ''}`}
            title={item.title}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="sbSpacer" />

      <button className="sbAlertBtn" title="Drift Alerts" onClick={toggleDrift}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {mockDriftItems.length > 0 && (
          <span className="alertBadge">{mockDriftItems.length}</span>
        )}
      </button>
    </nav>
  );
};

export default Sidebar;
