import { useState, useEffect } from 'react';
import { fetchTimeline } from '../lib/api';
import { mockFullTimeline } from '../data/timeline.mock';
import type { FullTimelineEvent } from '../types';
import './Pages.css';

const filterTypes = ['All', 'Commits', 'PRs', 'Drifts', 'Releases'];
const typeMap: Record<string, string> = { Commits: 'commit', PRs: 'pr', Drifts: 'drift', Releases: 'release' };
const typeIcons: Record<string, string> = { commit: '●', pr: '⎇', drift: '⚠', release: '🚀' };
const typeColors: Record<string, { color: string; bgColor: string }> = {
  commit: { color: 'var(--green)', bgColor: 'var(--green-dim)' },
  pr: { color: 'var(--purple)', bgColor: 'rgba(155,122,255,0.2)' },
  drift: { color: 'var(--amber)', bgColor: 'var(--amber-dim)' },
  release: { color: 'var(--cyan)', bgColor: 'var(--cyan-dim)' },
};

/**
 * TimelinePage — Full scrollable timeline of all events.
 */
const TimelinePage = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [events, setEvents] = useState<FullTimelineEvent[]>(mockFullTimeline);

  useEffect(() => {
    fetchTimeline(100)
      .then((res) => {
        if (res.events && res.events.length > 0) {
          const mapped = res.events.map((e: any) => ({
            ...e,
            color: typeColors[e.type]?.color || 'var(--cyan)',
            bgColor: typeColors[e.type]?.bgColor || 'var(--cyan-dim)',
          }));
          setEvents(mapped);
        }
      })
      .catch((err) => console.warn('Failed to fetch timeline, using mock:', err));
  }, []);

  const filtered = activeFilter === 'All'
    ? events
    : events.filter((e) => e.type === typeMap[activeFilter]);

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Timeline</div>
        <div className="pageSubtitle">{events.length} events · Chronological activity log</div>
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
