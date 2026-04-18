import { mockDiffs } from '../data/mockData';
import './Pages.css';

/**
 * DiffViewerPage — Side-by-side diff display with syntax highlighting.
 */
const DiffViewerPage = () => {
  const diff = mockDiffs[0];

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Diff Viewer</div>
        <div className="pageSubtitle">
          Commit {diff.commitHash} · {diff.filesChanged} files changed · {diff.author} · {diff.date}
        </div>
      </div>

      <div className="pageContent">
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
            <span className="commitHash">{diff.commitHash}</span>
            <span style={{ fontSize: '13px', color: '#fff' }}>{diff.message}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              {diff.author}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {diff.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              {diff.filesChanged} files changed
            </span>
          </div>
        </div>

        {diff.hunks.map((hunk, idx) => (
          <div key={idx} className="diffFile">
            <div className="diffFileHeader" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {hunk.file}
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{hunk.language}</span>
            </div>
            <div className="diffContent">
              {hunk.removed.map((line, i) => (
                <div key={`r-${i}`} className="diffLine diffRemoved">
                  <span style={{ opacity: 0.5, marginRight: '8px', userSelect: 'none' }}>−</span>
                  {line}
                </div>
              ))}
              <div style={{ height: '1px', background: 'var(--border)', margin: '2px 0' }} />
              {hunk.added.map((line, i) => (
                <div key={`a-${i}`} className="diffLine diffAdded">
                  <span style={{ opacity: 0.5, marginRight: '8px', userSelect: 'none' }}>+</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiffViewerPage;
