import { useState } from 'react';
import { mockFullTimeline } from '../data/mockData';
import './Pages.css';

const filterTypes = ['All', 'Commits', 'PRs', 'Drifts', 'Releases'];
const typeMap: Record<string, string> = { Commits: 'commit', PRs: 'pr', Drifts: 'drift', Releases: 'release' };
const typeIcons: Record<string, string> = { commit: '●', pr: '⎇', drift: '▲', release: '◆' };

/**
 * TimelinePage — Full scrollable timeline of all events.
 */
const TimelinePage = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? mockFullTimeline
    : mockFullTimeline.filter((e) => e.type === typeMap[activeFilter]);

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Timeline</div>
        <div className="pageSubtitle">{mockFullTimeline.length} events · Chronological activity log</div>
      </div>

      <div className="filterRow">
        {filterTypes.map((f) => (
          <button
            key={f}
            className={`filterBtn ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="pageContent">
        {filtered.map((event) => (
          <div key={event.id} className="vtlItem">
            <div
              className="vtlDot"
              style={{
                background: event.bgColor,
                borderColor: event.color,
                color: event.color,
              }}
            >
              {typeIcons[event.type] || '●'}
            </div>
            <div className="vtlContent">
              <div className="vtlTitle">{event.title}</div>
              <div className="vtlDesc">{event.description}</div>
              <div className="vtlMeta">
                <span>{event.date}</span>
                {event.hash && (
                  <span style={{ color: 'var(--purple)' }}>{event.hash}</span>
                )}
                <span
                  className="vtlTag"
                  style={{ color: event.color, borderColor: event.color, background: event.bgColor }}
                >
                  {event.type.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelinePage;
