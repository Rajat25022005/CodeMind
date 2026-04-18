/**
 * Mock data for the CodeMind UI demo.
 * This will be replaced with real API data later.
 */
import type {
  GraphNode,
  GraphEdge,
  Message,
  DriftItem,
  TimelineItem,
  StatusStats,
  SidebarItem,
  Tab,
  CommitItem,
  FileItem,
  DiffData,
  OnboardingStep,
  FullTimelineEvent,
} from '../types';

/* ── Graph Nodes ── */
export const graphNodes: GraphNode[] = [
  { id: 'auth_mid',  label: 'auth/middleware.py', type: 'module', x: 0.50, y: 0.38 },
  { id: 'jwt',       label: 'auth/jwt.py',       type: 'drift',  x: 0.38, y: 0.24 },
  { id: 'session',   label: 'auth/session.py',    type: 'module', x: 0.63, y: 0.22 },
  { id: 'user_svc',  label: 'UserService',        type: 'func',   x: 0.72, y: 0.40 },
  { id: 'db_conn',   label: 'db/connection.py',   type: 'module', x: 0.75, y: 0.58 },
  { id: 'rate_lim',  label: 'RateLimiter',        type: 'func',   x: 0.55, y: 0.57 },
  { id: 'token_ref', label: 'token_refresh()',     type: 'func',   x: 0.33, y: 0.46 },
  { id: 'pr47',      label: 'PR #47',             type: 'pr',     x: 0.25, y: 0.34 },
  { id: 'pr52',      label: 'PR #52',             type: 'pr',     x: 0.28, y: 0.60 },
  { id: 'c4f3',      label: '4f3a9c2',            type: 'commit', x: 0.18, y: 0.47 },
  { id: 'payment',   label: 'payments/core.py',   type: 'module', x: 0.82, y: 0.30 },
  { id: 'notif',     label: 'notifications/',     type: 'module', x: 0.85, y: 0.50 },
];

/* ── Graph Edges ── */
export const graphEdges: GraphEdge[] = [
  { from: 'pr47',      to: 'auth_mid',  type: 'refactored' },
  { from: 'auth_mid',  to: 'jwt',       type: 'depends' },
  { from: 'auth_mid',  to: 'session',   type: 'depends' },
  { from: 'auth_mid',  to: 'rate_lim',  type: 'introduced' },
  { from: 'auth_mid',  to: 'token_ref', type: 'depends' },
  { from: 'token_ref', to: 'jwt',       type: 'depends' },
  { from: 'c4f3',      to: 'token_ref', type: 'introduced' },
  { from: 'pr52',      to: 'rate_lim',  type: 'introduced' },
  { from: 'user_svc',  to: 'auth_mid',  type: 'depends' },
  { from: 'user_svc',  to: 'db_conn',   type: 'depends' },
  { from: 'db_conn',   to: 'payment',   type: 'depends' },
  { from: 'user_svc',  to: 'notif',     type: 'depends' },
  { from: 'pr47',      to: 'c4f3',      type: 'refactored' },
];

/* ── Color Maps ── */
export const nodeColors: Record<string, string> = {
  module: '#00d4ff',
  func:   '#2dda93',
  commit: '#f5a623',
  pr:     '#9b7aff',
  drift:  '#ff4e6a',
};

export const edgeColors: Record<string, string> = {
  depends:    'rgba(0, 212, 255, 0.3)',
  introduced: 'rgba(45, 218, 147, 0.35)',
  refactored: 'rgba(245, 166, 35, 0.35)',
};

/* ── Chat Messages ── */
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Why was auth middleware completely rewritten in v2?',
    timestamp: '10:42 AM',
  },
  {
    id: 'msg-2',
    role: 'ai',
    content:
      'The v2 rewrite was triggered by a <strong style="color:var(--cyan)">JWT expiry race condition</strong> discovered in production. Here\'s the evidence trail:',
    timestamp: '10:42 AM',
    hops: 3,
    citations: [
      { badge: 'PR #47', text: '"Refactor JWT flow to eliminate race on concurrent token refresh"' },
      { badge: 'Commit 4f3a9c2', text: 'Fix: validate expiry atomically under lock' },
      { badge: 'Comment', text: '@sarah: "seen this in prod twice, needs a full rethink"' },
    ],
    traceSteps: [
      { label: 'Graph walk', done: true },
      { label: 'PR lookup', done: true },
      { label: 'Synthesize', done: true },
    ],
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'What edge cases does the token refresh logic handle?',
    timestamp: '10:44 AM',
  },
  {
    id: 'msg-4',
    role: 'ai',
    content:
      'Based on commit history and inline comments, the refresh logic handles:<br/><br/>' +
      '<strong style="color:var(--green)">1.</strong> Simultaneous refresh from multiple tabs (mutex added in <span style="color:var(--purple);font-family:var(--font-mono);font-size:10px">commit 7c2e1f0</span>)<br/>' +
      '<strong style="color:var(--green)">2.</strong> Clock skew between services (<span style="color:var(--purple);font-family:var(--font-mono);font-size:10px">5s leeway</span> introduced PR #49)<br/>' +
      '<strong style="color:var(--green)">3.</strong> Revoked tokens mid-session via Redis blocklist',
    timestamp: '10:44 AM',
    hops: 2,
  },
];

/* ── Drift Items ── */
export const mockDriftItems: DriftItem[] = [
  {
    file: 'auth/jwt.py',
    timeAgo: '6h ago',
    message:
      'Token expiry validation no longer matches PR #47\'s documented atomic behavior. Concurrent refresh path is unguarded.',
    severity: 'BEHAVIOR_DRIFT',
  },
  {
    file: 'payments/webhook.py',
    timeAgo: '1d ago',
    message:
      'Idempotency key logic removed in commit <span style="color:var(--purple);font-family:var(--font-mono)">c91d3ae</span> without closing the original issue.',
    severity: 'MISSING_INTENT',
  },
  {
    file: 'db/connection.py',
    timeAgo: '3d ago',
    message:
      'Connection pool size hardcoded to 5; PR #38 comment specified it should always be configurable.',
    severity: 'CONSTRAINT_VIOLATION',
  },
];

/* ── Timeline Items (compact) ── */
export const mockTimelineItems: TimelineItem[] = [
  {
    title: 'PR #52 merged',
    description: 'Add rate-limit middleware · 2h ago',
    color: 'var(--cyan)',
    bgColor: 'var(--cyan-dim)',
  },
  {
    title: 'Drift flagged',
    description: 'auth/jwt.py diverged · 6h ago',
    color: 'var(--amber)',
    bgColor: 'var(--amber-dim)',
  },
  {
    title: 'Commit 4f3a9c2',
    description: 'Fix token expiry race · 1d ago',
    color: 'var(--green)',
    bgColor: 'var(--green-dim)',
  },
  {
    title: 'PR #47 merged',
    description: 'Auth v2 rewrite · 4d ago',
    color: 'var(--purple)',
    bgColor: 'rgba(155, 122, 255, 0.2)',
  },
];

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
  { icon: '◈', title: 'Query', id: 'query', path: '/query' },
  { icon: '◷', title: 'Timeline', id: 'timeline', path: '/timeline' },
];

export const sidebarSecondary: SidebarItem[] = [
  { icon: '⊟', title: 'Files', id: 'files', path: '/files' },
  { icon: '⎇', title: 'Commits', id: 'commits', path: '/commits' },
];

/* ── Tab Definitions ── */
export const graphTabs: Tab[] = [
  { label: 'Knowledge Graph', color: 'var(--cyan)',   id: 'knowledge-graph' },
  { label: 'Decision Trail',  color: 'var(--amber)',  id: 'decision-trail' },
  { label: 'Diff Viewer',     color: 'var(--green)',  id: 'diff-viewer' },
  { label: 'Onboarding',      color: 'var(--purple)', id: 'onboarding' },
];

/* ── Node Tooltip Demo Data ── */
export const activeNodeTooltip = {
  icon: '◇',
  title: 'auth/middleware.py',
  subtitle: 'Module · 847 lines · Python',
  rows: [
    { label: 'Last modified', value: '2 days ago' },
    { label: 'Commits touching', value: '23' },
    { label: 'Dependents', value: '7 modules' },
    { label: 'Key event', value: 'v2 rewrite', highlight: true },
  ],
  driftTag: 'Intent drift detected',
};

/* ── Node tooltip data for all nodes ── */
export const nodeTooltipData: Record<string, {
  icon: string;
  title: string;
  subtitle: string;
  rows: { label: string; value: string; highlight?: boolean }[];
  driftTag?: string;
}> = {
  auth_mid: activeNodeTooltip,
  jwt: {
    icon: '▲',
    title: 'auth/jwt.py',
    subtitle: 'Drift · 312 lines · Python',
    rows: [
      { label: 'Last modified', value: '6h ago' },
      { label: 'Commits touching', value: '18' },
      { label: 'Dependents', value: '3 modules' },
      { label: 'Status', value: 'Drift detected', highlight: true },
    ],
    driftTag: 'Behavior drift — concurrent refresh unguarded',
  },
  session: {
    icon: '◇',
    title: 'auth/session.py',
    subtitle: 'Module · 234 lines · Python',
    rows: [
      { label: 'Last modified', value: '5 days ago' },
      { label: 'Commits touching', value: '11' },
      { label: 'Dependents', value: '2 modules' },
      { label: 'Key event', value: 'Session store migration' },
    ],
  },
  user_svc: {
    icon: '⨍',
    title: 'UserService',
    subtitle: 'Function · 156 lines · Python',
    rows: [
      { label: 'Last modified', value: '1 day ago' },
      { label: 'Commits touching', value: '31' },
      { label: 'Dependencies', value: '4 modules' },
      { label: 'Key event', value: 'Role-based access added' },
    ],
  },
  db_conn: {
    icon: '◇',
    title: 'db/connection.py',
    subtitle: 'Module · 189 lines · Python',
    rows: [
      { label: 'Last modified', value: '3 days ago' },
      { label: 'Commits touching', value: '15' },
      { label: 'Dependents', value: '5 modules' },
      { label: 'Key event', value: 'Pool size config', highlight: true },
    ],
    driftTag: 'Constraint violation — hardcoded pool size',
  },
  rate_lim: {
    icon: '⨍',
    title: 'RateLimiter',
    subtitle: 'Function · 98 lines · Python',
    rows: [
      { label: 'Last modified', value: '2h ago' },
      { label: 'Commits touching', value: '4' },
      { label: 'Introduced by', value: 'PR #52' },
      { label: 'Status', value: 'New' },
    ],
  },
  token_ref: {
    icon: '⨍',
    title: 'token_refresh()',
    subtitle: 'Function · 67 lines · Python',
    rows: [
      { label: 'Last modified', value: '1 day ago' },
      { label: 'Commits touching', value: '9' },
      { label: 'Dependencies', value: '2 modules' },
      { label: 'Key event', value: 'Atomic validation' },
    ],
  },
  pr47: {
    icon: '⎇',
    title: 'PR #47',
    subtitle: 'Pull Request · Merged',
    rows: [
      { label: 'Author', value: '@sarah' },
      { label: 'Merged', value: '4 days ago' },
      { label: 'Files changed', value: '12' },
      { label: 'Impact', value: 'Auth v2 rewrite', highlight: true },
    ],
  },
  pr52: {
    icon: '⎇',
    title: 'PR #52',
    subtitle: 'Pull Request · Merged',
    rows: [
      { label: 'Author', value: '@alex' },
      { label: 'Merged', value: '2h ago' },
      { label: 'Files changed', value: '3' },
      { label: 'Impact', value: 'Rate limiting' },
    ],
  },
  c4f3: {
    icon: '●',
    title: '4f3a9c2',
    subtitle: 'Commit · 1 day ago',
    rows: [
      { label: 'Author', value: '@sarah' },
      { label: 'Message', value: 'Fix token expiry race' },
      { label: 'Files changed', value: '2' },
      { label: 'Part of', value: 'PR #47' },
    ],
  },
  payment: {
    icon: '⬡',
    title: 'payments/core.py',
    subtitle: 'Module · 512 lines · Python',
    rows: [
      { label: 'Last modified', value: '1 week ago' },
      { label: 'Commits touching', value: '27' },
      { label: 'Dependents', value: '3 modules' },
      { label: 'Key event', value: 'Webhook refactor' },
    ],
  },
  notif: {
    icon: '⬡',
    title: 'notifications/',
    subtitle: 'Package · 4 files · Python',
    rows: [
      { label: 'Last modified', value: '3 days ago' },
      { label: 'Commits touching', value: '8' },
      { label: 'Dependents', value: '1 module' },
      { label: 'Key event', value: 'Email templates added' },
    ],
  },
};

/* ── Commits Page Data ── */
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

/* ── Files Page Data ── */
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

/* ── Diff Viewer Data ── */
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

/* ── Onboarding Page Data ── */
export const mockOnboardingSteps: OnboardingStep[] = [
  {
    date: '3 weeks ago',
    title: 'Initial auth middleware created',
    description: 'Basic token validation middleware added. Simple JWT decode and expiry check. No concurrency handling.',
    type: 'create',
    commit: '5e8c1a4',
  },
  {
    date: '2 weeks ago',
    title: 'Connection pool integrated',
    description: 'Database connection pool added for session store backing. Config initially set to 5 max connections.',
    type: 'feature',
    commit: 'd7f3b19',
  },
  {
    date: '1 week ago',
    title: 'Session store migrated to Redis',
    description: 'Moved session storage from SQLite to Redis for better horizontal scaling. Session module rewritten.',
    type: 'refactor',
    commit: 'f1c8b23',
    pr: 'PR #42',
  },
  {
    date: '4 days ago',
    title: 'Auth v2 complete rewrite',
    description: 'Full rewrite of auth middleware triggered by JWT expiry race condition found in production. Added atomic token validation, concurrent tab refresh mutex, and clock skew leeway. 12 files changed.',
    type: 'refactor',
    commit: 'b8e4f12',
    pr: 'PR #47',
  },
  {
    date: '1 day ago',
    title: 'Token expiry race fix',
    description: 'Validate expiry atomically under lock. Addresses the specific race condition where concurrent requests could bypass expiry check.',
    type: 'fix',
    commit: '4f3a9c2',
  },
  {
    date: '2 hours ago',
    title: 'Rate limiting added',
    description: 'New RateLimiter function added to API gateway. Protects auth endpoints from brute force attempts. 3 files changed.',
    type: 'feature',
    commit: 'a1b2c3d',
    pr: 'PR #52',
  },
];

/* ── Full Timeline Events ── */
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

/* ── Mock AI Responses for query ── */
export const mockAIResponses: string[] = [
  'Based on the graph analysis, I found <strong style="color:var(--green)">3 related commits</strong> that touch this module. The most significant change was introduced in <span style="color:var(--purple);font-family:var(--font-mono);font-size:10px">PR #47</span> which refactored the entire authentication flow.',
  'Looking at the temporal graph, this function was <strong style="color:var(--cyan)">introduced to fix a production incident</strong>. The original issue was reported in GitHub Issue #23 and the fix was validated across 4 test environments.',
  'The decision trail shows this pattern was adopted after <strong style="color:var(--amber)">evaluating 3 alternatives</strong>. The team chose this approach over Redis-based locking due to lower latency requirements documented in the ADR.',
  'Cross-referencing commit history with PR discussions, this module has been <strong style="color:var(--green)">stable for 2 weeks</strong> with no drift detected. The last major change was the idempotency key addition in <span style="color:var(--purple);font-family:var(--font-mono);font-size:10px">commit 9a2d4e6</span>.',
];
