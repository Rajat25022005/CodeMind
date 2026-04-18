import { mockDriftItems } from '../data/mockData';
import './DriftAlerts.css';

interface DriftAlertsProps {
  onClose: () => void;
}

/**
 * DriftAlerts
 * Slide-in panel showing intent drift notifications.
 * Positioned absolutely within the workspace area.
 */
const DriftAlerts = ({ onClose }: DriftAlertsProps) => {
  return (
    <div className="driftPanel" id="drift-alerts">
      <div className="dpHeader">
        <div className="dpTitle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Intent Drift Alerts
          <span className="dpTitleCount">{mockDriftItems.length} active</span>
        </div>
        <button className="dpClose" onClick={onClose} aria-label="Close drift panel">
          ✕
        </button>
      </div>

      {mockDriftItems.map((item, idx) => (
        <div key={idx} className="driftItem">
          <div className="diTop">
            <div className="diFile">{item.file}</div>
            <div className="diTime">{item.timeAgo}</div>
          </div>
          <div className="diMsg" dangerouslySetInnerHTML={{ __html: item.message }} />
          <span className="diBadge">{item.severity}</span>
        </div>
      ))}
    </div>
  );
};

export default DriftAlerts;
