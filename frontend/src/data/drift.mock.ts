/**
 * Drift alert data.
 */
import type { DriftItem } from '../types';

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
