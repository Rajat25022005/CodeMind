import DOMPurify from 'dompurify';
import { mockDriftItems } from '../data/drift.mock';
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
          ⚠ Intent Drift Alerts
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
          <div className="diMsg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.message) }} />
          <span className="diBadge">{item.severity}</span>
        </div>
      ))}
    </div>
  );
};

export default DriftAlerts;
