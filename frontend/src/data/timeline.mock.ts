/**
 * Timeline event data — compact sidebar strip and full page timeline.
 */
import type { TimelineItem, FullTimelineEvent } from '../types';

export const mockTimelineItems: TimelineItem[] = [
  { title: 'PR #52 merged', description: 'Add rate-limit middleware · 2h ago', color: 'var(--cyan)', bgColor: 'var(--cyan-dim)' },
  { title: 'Drift flagged', description: 'auth/jwt.py diverged · 6h ago', color: 'var(--amber)', bgColor: 'var(--amber-dim)' },
  { title: 'Commit 4f3a9c2', description: 'Fix token expiry race · 1d ago', color: 'var(--green)', bgColor: 'var(--green-dim)' },
  { title: 'PR #47 merged', description: 'Auth v2 rewrite · 4d ago', color: 'var(--purple)', bgColor: 'rgba(155, 122, 255, 0.2)' },
];

export const mockFullTimeline: FullTimelineEvent[] = [
  { id: 'tl-1', title: 'PR #52 merged', description: 'Add rate-limit middleware to API gateway', date: '2h ago', type: 'pr', color: 'var(--cyan)', bgColor: 'var(--cyan-dim)', hash: 'a1b2c3d' },
  { id: 'tl-2', title: 'Drift: auth/jwt.py', description: 'Token expiry validation diverged from documented behavior', date: '6h ago', type: 'drift', color: 'var(--amber)', bgColor: 'var(--amber-dim)' },
  { id: 'tl-3', title: 'Commit 4f3a9c2', description: 'Fix token expiry race condition with atomic lock', date: '1d ago', type: 'commit', color: 'var(--green)', bgColor: 'var(--green-dim)', hash: '4f3a9c2' },
  { id: 'tl-4', title: 'Drift: payments/webhook.py', description: 'Idempotency key logic removed without closing the original issue', date: '1d ago', type: 'drift', color: 'var(--amber)', bgColor: 'var(--amber-dim)' },
  { id: 'tl-5', title: 'Commit 7c2e1f0', description: 'Add mutex for concurrent tab refresh', date: '2d ago', type: 'commit', color: 'var(--green)', bgColor: 'var(--green-dim)', hash: '7c2e1f0' },
  { id: 'tl-6', title: 'Drift: db/connection.py', description: 'Pool size hardcoded after PR #38 specified configurable', date: '3d ago', type: 'drift', color: 'var(--amber)', bgColor: 'var(--amber-dim)' },
  { id: 'tl-7', title: 'PR #47 merged', description: 'Auth v2 complete rewrite — 12 files changed', date: '4d ago', type: 'pr', color: 'var(--purple)', bgColor: 'rgba(155,122,255,0.2)', hash: 'b8e4f12' },
  { id: 'tl-8', title: 'Commit e3d9a7b', description: 'Add email notification templates', date: '5d ago', type: 'commit', color: 'var(--green)', bgColor: 'var(--green-dim)', hash: 'e3d9a7b' },
  { id: 'tl-9', title: 'v1.2.0 release', description: 'Session store migration + auth improvements', date: '1w ago', type: 'release', color: 'var(--cyan)', bgColor: 'var(--cyan-dim)' },
  { id: 'tl-10', title: 'Commit f1c8b23', description: 'Migrate session store to Redis', date: '1w ago', type: 'commit', color: 'var(--green)', bgColor: 'var(--green-dim)', hash: 'f1c8b23' },
];
