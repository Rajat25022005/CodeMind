import { mockOnboardingSteps } from '../data/mockData';
import './Pages.css';

const typeColors: Record<string, { color: string; bg: string }> = {
  create:   { color: 'var(--cyan)',   bg: 'var(--cyan-dim)' },
  refactor: { color: 'var(--amber)',  bg: 'var(--amber-dim)' },
  fix:      { color: 'var(--red)',    bg: 'var(--red-dim)' },
  feature:  { color: 'var(--green)',  bg: 'var(--green-dim)' },
};

/**
 * OnboardingPage — Chronological story of how a module evolved.
 */
const OnboardingPage = () => {
  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Onboarding — Auth Module</div>
        <div className="pageSubtitle">
          Chronological evolution · {mockOnboardingSteps.length} key events · auth/middleware.py
        </div>
      </div>

      <div className="pageContent">
        <div style={{ maxWidth: '640px' }}>
          {mockOnboardingSteps.map((step, idx) => {
            const colors = typeColors[step.type] || typeColors.feature;
            return (
              <div key={idx} className="vtlItem">
                <div
                  className="vtlDot"
                  style={{
                    background: colors.bg,
                    borderColor: colors.color,
                    color: colors.color,
                    fontSize: '11px',
                  }}
                >
                  {step.type === 'create' && '✦'}
                  {step.type === 'refactor' && '↻'}
                  {step.type === 'fix' && '✎'}
                  {step.type === 'feature' && '+'}
                </div>
                <div className="vtlContent">
                  <div className="vtlTitle">{step.title}</div>
                  <div className="vtlDesc">{step.description}</div>
                  <div className="vtlMeta">
                    <span>{step.date}</span>
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
