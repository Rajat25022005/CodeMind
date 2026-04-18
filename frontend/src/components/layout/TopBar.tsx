import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { mockDriftItems, mockStats } from '../../data/mockData';
import './TopBar.css';

type PanelType = 'settings' | 'profile' | null;

const TopBar = () => {
  const { toggleDrift } = useApp();
  const [openPanel, setOpenPanel] = useState<PanelType>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    if (openPanel) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPanel]);

  const togglePanel = (panel: PanelType) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <header className="topbar">
      <div className="logo" onClick={() => window.location.assign('/')} style={{ cursor: 'pointer' }}>
        <div className="logoIcon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        CodeMind
      </div>
      <div className="repoBadge">nexus-workplace / main · 2,847 commits</div>
      <span className="separator">|</span>
      <span className="pill pillCyan">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Indexed
      </span>
      <div className="topbarRight" ref={panelRef}>
        <span className="pill pillAmber" onClick={toggleDrift} style={{ cursor: 'pointer' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {mockDriftItems.length} Drifts
        </span>

        {/* Settings Button */}
        <div className="navIconWrap">
          <div
            className={`navIcon ${openPanel === 'settings' ? 'navIconActive' : ''}`}
            title="Settings"
            onClick={() => togglePanel('settings')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          {openPanel === 'settings' && (
            <div className="dropdownPanel">
              <div className="dpanelTitle">Settings</div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Model</div>
                <div className="dpanelValue">{mockStats.model}</div>
              </div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Backend</div>
                <div className="dpanelValue">Ollama · Local</div>
              </div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Graph DB</div>
                <div className="dpanelValue">Qdrant · localhost:6333</div>
              </div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Avg Query Time</div>
                <div className="dpanelValue">{mockStats.avgQuery}</div>
              </div>
              <div className="dpanelDivider" />
              <div className="dpanelSection">
                <div className="dpanelLabel">Theme</div>
                <div className="dpanelValue">Dark</div>
              </div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Version</div>
                <div className="dpanelValue">v0.1.0</div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Button */}
        <div className="navIconWrap">
          <div
            className={`navIcon ${openPanel === 'profile' ? 'navIconActive' : ''}`}
            title="User Profile"
            onClick={() => togglePanel('profile')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {openPanel === 'profile' && (
            <div className="dropdownPanel">
              <div className="dpanelProfile">
                <div className="dpanelAvatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div className="dpanelName">Developer</div>
                  <div className="dpanelEmail">dev@codemind.local</div>
                </div>
              </div>
              <div className="dpanelDivider" />
              <div className="dpanelSection">
                <div className="dpanelLabel">Repository</div>
                <div className="dpanelValue">nexus-workplace</div>
              </div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Branch</div>
                <div className="dpanelValue">main</div>
              </div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Nodes Indexed</div>
                <div className="dpanelValue">{mockStats.nodes.toLocaleString()}</div>
              </div>
              <div className="dpanelSection">
                <div className="dpanelLabel">Commits Indexed</div>
                <div className="dpanelValue">{mockStats.commits.toLocaleString()}</div>
              </div>
              <div className="dpanelDivider" />
              <div className="dpanelSection">
                <div className="dpanelLabel">Active Drifts</div>
                <div className="dpanelValue" style={{ color: 'var(--amber)' }}>{mockStats.driftCount}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
