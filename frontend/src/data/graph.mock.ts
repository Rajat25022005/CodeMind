/**
 * Graph mock data — nodes, edges, color maps, and node tooltip data.
 */
import type { GraphNode, GraphEdge } from '../types';

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

/* ── Node Tooltip Data (keyed by node ID) ── */
export const nodeTooltipData: Record<string, {
  icon: string;
  title: string;
  subtitle: string;
  rows: { label: string; value: string; highlight?: boolean }[];
  driftTag?: string;
}> = {
  auth_mid: {
    icon: '⬡',
    title: 'auth/middleware.py',
    subtitle: 'Module · 847 lines · Python',
    rows: [
      { label: 'Last modified', value: '2 days ago' },
      { label: 'Commits touching', value: '23' },
      { label: 'Dependents', value: '7 modules' },
      { label: 'Key event', value: 'v2 rewrite', highlight: true },
    ],
    driftTag: '⚠ Intent drift detected',
  },
  jwt: {
    icon: '⚠',
    title: 'auth/jwt.py',
    subtitle: 'Drift · 312 lines · Python',
    rows: [
      { label: 'Last modified', value: '6h ago' },
      { label: 'Commits touching', value: '18' },
      { label: 'Dependents', value: '3 modules' },
      { label: 'Status', value: 'Drift detected', highlight: true },
    ],
    driftTag: '⚠ Behavior drift — concurrent refresh unguarded',
  },
  session: {
    icon: '⬡',
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
    icon: '⬡',
    title: 'db/connection.py',
    subtitle: 'Module · 189 lines · Python',
    rows: [
      { label: 'Last modified', value: '3 days ago' },
      { label: 'Commits touching', value: '15' },
      { label: 'Dependents', value: '5 modules' },
      { label: 'Key event', value: 'Pool size config', highlight: true },
    ],
    driftTag: '⚠ Constraint violation — hardcoded pool size',
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
