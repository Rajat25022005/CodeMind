/**
 * Chat messages and AI response templates.
 */
import type { Message } from '../types';

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

export const mockAIResponses: string[] = [
  'Based on the graph analysis, I found <strong style="color:var(--green)">3 related commits</strong> that touch this module. The most significant change was introduced in <span style="color:var(--purple);font-family:var(--font-mono);font-size:10px">PR #47</span> which refactored the entire authentication flow.',
  'Looking at the temporal graph, this function was <strong style="color:var(--cyan)">introduced to fix a production incident</strong>. The original issue was reported in GitHub Issue #23 and the fix was validated across 4 test environments.',
  'The decision trail shows this pattern was adopted after <strong style="color:var(--amber)">evaluating 3 alternatives</strong>. The team chose this approach over Redis-based locking due to lower latency requirements documented in the ADR.',
  'Cross-referencing commit history with PR discussions, this module has been <strong style="color:var(--green)">stable for 2 weeks</strong> with no drift detected. The last major change was the idempotency key addition in <span style="color:var(--purple);font-family:var(--font-mono);font-size:10px">commit 9a2d4e6</span>.',
];
