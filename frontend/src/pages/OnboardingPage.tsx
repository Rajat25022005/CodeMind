import { useState, useEffect } from 'react';
import { postOnboard } from '../lib/api';
import { mockOnboardingSteps } from '../data/repo.mock';
import type { OnboardingStep } from '../types';
import './Pages.css';

const typeColors: Record<string, { color: string; bg: string }> = {
  create:   { color: 'var(--cyan)',   bg: 'var(--cyan-dim)' },
  refactor: { color: 'var(--amber)',  bg: 'var(--amber-dim)' },
  fix:      { color: 'var(--red)',    bg: 'var(--red-dim)' },
  feature:  { color: 'var(--green)',  bg: 'var(--green-dim)' },
};

const typeIcons: Record<string, string> = {
  create: '✦',
  refactor: '⟲',
  fix: '🔧',
  feature: '✚',
};

/**
 * OnboardingPage — Chronological story of how a module evolved.
 * Enter a module path to generate a walkthrough via the backend,
 * or view mock data when the API is unavailable.
 */
const OnboardingPage = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>(mockOnboardingSteps);
  const [modulePath, setModulePath] = useState('auth/middleware.py');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOnboarding = (path: string) => {
    setLoading(true);
    setError('');
    postOnboard(path)
      .then((res) => {
        if (res.steps && res.steps.length > 0) {
          const mapped = (res.steps as any[]).map((s) => ({
            date: s.date || '',
            title: s.title || '',
            description: s.description || '',
            type: s.type || 'feature',
            commit: s.commit || '',
            pr: s.pr || '',
          }));
          setSteps(mapped);
          setSummary(res.summary || '');
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch onboarding, using mock:', err);
        setError('API unavailable — showing demo data');
      })
      .finally(() => setLoading(false));
  };

  // Load on mount
  useEffect(() => {
    loadOnboarding(modulePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modulePath.trim()) loadOnboarding(modulePath.trim());
  };

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Onboarding</div>
        <div className="pageSubtitle">
          Chronological evolution · {steps.length} key events
        </div>
      </div>

      {/* Module path input */}
      <form onSubmit={handleSubmit} className="filterRow" style={{ gap: '8px' }}>
        <input
          type="text"
          value={modulePath}
          onChange={(e) => setModulePath(e.target.value)}
          placeholder="Enter module path (e.g. auth/middleware.py)"
          className="onboardInput"
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '7px 12px',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="filterBtn active"
          disabled={loading}
          style={{ padding: '7px 16px', fontSize: '11px' }}
        >
          {loading ? '⏳ Loading…' : '🔍 Generate'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '4px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber)' }}>
          {error}
        </div>
      )}

      {summary && (
        <div style={{
          padding: '10px 16px', margin: '0 0 8px',
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: 'var(--muted)', background: 'var(--bg-card)',
          borderRadius: '6px', border: '1px solid var(--border)',
        }}>
          {summary}
        </div>
      )}

      <div className="pageContent">
        <div style={{ maxWidth: '640px' }}>
          {steps.map((step, idx) => {
            const colors = typeColors[step.type] || typeColors.feature;
            return (
              <div key={idx} className="vtlItem">
                <div
                  className="vtlDot"
                  style={{
                    background: colors.bg,
                    borderColor: colors.color,
                    color: colors.color,
                  }}
                >
                  {typeIcons[step.type]}
                </div>
                <div className="vtlContent">
                  <div className="vtlTitle">{step.title}</div>
                  <div className="vtlDesc">{step.description}</div>
                  <div className="vtlMeta">
                    <span>📅 {step.date}</span>
                    {step.commit && (
                      <span style={{ color: 'var(--purple)' }}>{step.commit}</span>
                    )}
                    {step.pr && (
                      <span style={{ color: 'var(--purple)' }}>{step.pr}</span>
                    )}
                    <span
                      className="vtlTag"
                      style={{
                        color: colors.color,
                        borderColor: colors.color,
                        background: colors.bg,
                      }}
                    >
                      {step.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
