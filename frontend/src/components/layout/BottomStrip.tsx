import { mockStats } from '../../data/mockData';
import './BottomStrip.css';

const BottomStrip = () => {
  return (
    <footer className="bottomStrip">
      <div className="bsItem">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
          <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
        </svg>
        <span className="bsHighlight">{mockStats.nodes.toLocaleString()}</span> nodes
      </div>
      <div className="bsItem">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="bsHighlight">{mockStats.edges.toLocaleString()}</span> edges
      </div>
      <div className="bsItem">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="1.05" y1="12" x2="7" y2="12" />
          <line x1="17.01" y1="12" x2="22.96" y2="12" />
        </svg>
        <span className="bsHighlight">{mockStats.commits.toLocaleString()}</span> commits indexed
      </div>
      <div className="bsItem">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        Ollama <span className="bsHighlight">{mockStats.model}</span> · local
      </div>
      <div className="bsItem">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="bsHighlight">{mockStats.avgQuery}</span> avg query
      </div>
      <div className="bsDrift">
        <div className="bsDriftDot" />
        {mockStats.driftCount} intent drifts active
      </div>
    </footer>
  );
};

export default BottomStrip;
