/**
 * Repository-level data — sidebar, tabs, stats, commits, files, diffs, onboarding.
 */
import type {
  StatusStats,
  SidebarItem,
  Tab,
  CommitItem,
  FileItem,
  DiffData,
  OnboardingStep,
} from '../types';

/* ── Status Bar Stats ── */
export const mockStats: StatusStats = {
  nodes: 1247,
  edges: 3891,
  commits: 2847,
  model: 'llama3:8b',
  avgQuery: '127ms',
  driftCount: 3,
};

/* ── Sidebar Items ── */
export const sidebarItems: SidebarItem[] = [
  { icon: '⬡', title: 'Graph', id: 'graph', path: '/' },
  { icon: '💬', title: 'Query', id: 'query', path: '/query' },
  { icon: '📅', title: 'Timeline', id: 'timeline', path: '/timeline' },
];

export const sidebarSecondary: SidebarItem[] = [
  { icon: '📁', title: 'Files', id: 'files', path: '/files' },
  { icon: '🔀', title: 'Commits', id: 'commits', path: '/commits' },
];

/* ── Tab Definitions ── */
export const graphTabs: Tab[] = [
  { label: 'Knowledge Graph', color: 'var(--cyan)',   id: 'knowledge-graph' },
  { label: 'Decision Trail',  color: 'var(--amber)',  id: 'decision-trail' },
  { label: 'Diff Viewer',     color: 'var(--green)',  id: 'diff-viewer' },
  { label: 'Onboarding',      color: 'var(--purple)', id: 'onboarding' },
];

/* ── Commits ── */
export const mockCommits: CommitItem[] = [
  { hash: 'a1b2c3d', message: 'Add rate-limit middleware to API gateway', author: 'alex', date: '2h ago', filesChanged: 3, graphNodes: 2 },
  { hash: '4f3a9c2', message: 'Fix token expiry race condition with atomic lock', author: 'sarah', date: '1d ago', filesChanged: 2, graphNodes: 3 },
  { hash: '7c2e1f0', message: 'Add mutex for concurrent tab refresh', author: 'sarah', date: '2d ago', filesChanged: 1, graphNodes: 1 },
  { hash: 'c91d3ae', message: 'Remove idempotency key logic from webhook handler', author: 'mike', date: '3d ago', filesChanged: 1, graphNodes: 2 },
  { hash: 'b8e4f12', message: 'Merge PR #47: Auth v2 complete rewrite', author: 'sarah', date: '4d ago', filesChanged: 12, graphNodes: 7 },
  { hash: 'e3d9a7b', message: 'Add email notification templates', author: 'priya', date: '5d ago', filesChanged: 4, graphNodes: 1 },
  { hash: 'f1c8b23', message: 'Migrate session store to Redis', author: 'alex', date: '1w ago', filesChanged: 3, graphNodes: 2 },
  { hash: '9a2d4e6', message: 'Refactor payment webhook for idempotency', author: 'mike', date: '1w ago', filesChanged: 5, graphNodes: 3 },
  { hash: 'd7f3b19', message: 'Add connection pool configuration', author: 'alex', date: '2w ago', filesChanged: 2, graphNodes: 1 },
  { hash: '5e8c1a4', message: 'Initial auth middleware implementation', author: 'sarah', date: '3w ago', filesChanged: 6, graphNodes: 4 },
];

/* ── Files ── */
export const mockFiles: FileItem[] = [
  { path: 'auth/', language: '', lines: 0, lastModified: '', connections: 0, isDir: true, children: [
    { path: 'auth/middleware.py', language: 'Python', lines: 847, lastModified: '2d ago', connections: 7, isDir: false },
    { path: 'auth/jwt.py', language: 'Python', lines: 312, lastModified: '6h ago', connections: 3, isDir: false },
    { path: 'auth/session.py', language: 'Python', lines: 234, lastModified: '5d ago', connections: 2, isDir: false },
  ]},
  { path: 'db/', language: '', lines: 0, lastModified: '', connections: 0, isDir: true, children: [
    { path: 'db/connection.py', language: 'Python', lines: 189, lastModified: '3d ago', connections: 5, isDir: false },
    { path: 'db/models.py', language: 'Python', lines: 456, lastModified: '1w ago', connections: 3, isDir: false },
  ]},
  { path: 'payments/', language: '', lines: 0, lastModified: '', connections: 0, isDir: true, children: [
    { path: 'payments/core.py', language: 'Python', lines: 512, lastModified: '1w ago', connections: 3, isDir: false },
    { path: 'payments/webhook.py', language: 'Python', lines: 178, lastModified: '1d ago', connections: 2, isDir: false },
  ]},
  { path: 'notifications/', language: '', lines: 0, lastModified: '', connections: 0, isDir: true, children: [
    { path: 'notifications/email.py', language: 'Python', lines: 89, lastModified: '5d ago', connections: 1, isDir: false },
    { path: 'notifications/push.py', language: 'Python', lines: 67, lastModified: '1w ago', connections: 1, isDir: false },
  ]},
];

/* ── Diffs ── */
export const mockDiffs: DiffData[] = [
  {
    commitHash: '4f3a9c2',
    message: 'Fix token expiry race condition with atomic lock',
    author: 'sarah',
    date: '1 day ago',
    filesChanged: 2,
    hunks: [
      {
        file: 'auth/jwt.py',
        language: 'python',
        removed: [
          'def validate_token(token: str) -> bool:',
          '    payload = decode_jwt(token)',
          '    if payload["exp"] < time.time():',
          '        return False',
          '    return True',
        ],
        added: [
          'def validate_token(token: str) -> bool:',
          '    with token_lock:  # atomic validation',
          '        payload = decode_jwt(token)',
          '        if payload["exp"] < time.time() - CLOCK_SKEW_LEEWAY:',
          '            return False',
          '        if is_revoked(payload["jti"]):',
          '            return False',
          '        return True',
        ],
      },
      {
        file: 'auth/middleware.py',
        language: 'python',
        removed: [
          'async def auth_middleware(request):',
          '    token = extract_token(request)',
          '    if not validate_token(token):',
          '        raise HTTPException(401)',
        ],
        added: [
          'async def auth_middleware(request):',
          '    token = extract_token(request)',
          '    try:',
          '        if not validate_token(token):',
          '            raise HTTPException(401)',
          '    except TokenExpiredError:',
          '        new_token = await refresh_token(token)',
          '        request.state.token = new_token',
        ],
      },
    ],
  },
];

/* ── Onboarding ── */
export const mockOnboardingSteps: OnboardingStep[] = [
  { date: '3 weeks ago', title: 'Initial auth middleware created', description: 'Basic token validation middleware added. Simple JWT decode and expiry check. No concurrency handling.', type: 'create', commit: '5e8c1a4' },
  { date: '2 weeks ago', title: 'Connection pool integrated', description: 'Database connection pool added for session store backing. Config initially set to 5 max connections.', type: 'feature', commit: 'd7f3b19' },
  { date: '1 week ago', title: 'Session store migrated to Redis', description: 'Moved session storage from SQLite to Redis for better horizontal scaling. Session module rewritten.', type: 'refactor', commit: 'f1c8b23', pr: 'PR #42' },
  { date: '4 days ago', title: 'Auth v2 complete rewrite', description: 'Full rewrite of auth middleware triggered by JWT expiry race condition found in production. Added atomic token validation, concurrent tab refresh mutex, and clock skew leeway. 12 files changed.', type: 'refactor', commit: 'b8e4f12', pr: 'PR #47' },
  { date: '1 day ago', title: 'Token expiry race fix', description: 'Validate expiry atomically under lock. Addresses the specific race condition where concurrent requests could bypass expiry check.', type: 'fix', commit: '4f3a9c2' },
  { date: '2 hours ago', title: 'Rate limiting added', description: 'New RateLimiter function added to API gateway. Protects auth endpoints from brute force attempts. 3 files changed.', type: 'feature', commit: 'a1b2c3d', pr: 'PR #52' },
];
