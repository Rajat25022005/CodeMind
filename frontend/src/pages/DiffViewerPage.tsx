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
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', display: 'flex', gap: '16px' }}>
            <span>👤 {diff.author}</span>
            <span>📅 {diff.date}</span>
            <span>📝 {diff.filesChanged} files changed</span>
          </div>
        </div>

        {diff.hunks.map((hunk, idx) => (
          <div key={idx} className="diffFile">
            <div className="diffFileHeader">
              📄 {hunk.file}
              <span style={{ float: 'right', color: 'var(--muted)' }}>{hunk.language}</span>
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
