import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchCommitDiff } from '../lib/api';
import { mockDiffs } from '../data/repo.mock';
import type { DiffData } from '../types';
import './Pages.css';

/**
 * DiffViewerPage — Unified diff display with syntax highlighting.
 * Accepts an optional `?commit=<hash>` query parameter.
 * Falls back to mock data when the API is unavailable.
 */
const DiffViewerPage = () => {
  const [searchParams] = useSearchParams();
  const commitHash = searchParams.get('commit');
  const [diff, setDiff] = useState<DiffData>(mockDiffs[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!commitHash) return;

    setLoading(true);
    fetchCommitDiff(commitHash)
      .then((res) => {
        setDiff({
          commitHash: res.commitHash || commitHash,
          message: res.message || '',
          author: res.author || '',
          date: res.date || '',
          filesChanged: res.filesChanged || 0,
          hunks: (res.files || []).map((file: string) => ({
            file,
            language: file.split('.').pop() || 'text',
            removed: [],
            added: [],
          })),
        });
      })
      .catch((err) => {
        console.warn('Failed to fetch commit diff, using mock:', err);
      })
      .finally(() => setLoading(false));
  }, [commitHash]);

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Diff Viewer</div>
        <div className="pageSubtitle">
          Commit {diff.commitHash} · {diff.filesChanged} files changed · {diff.author} · {diff.date}
        </div>
      </div>

      {loading && (
        <div style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
          ⏳ Loading diff…
        </div>
      )}

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
              {(hunk.removed.length > 0 && hunk.added.length > 0) && (
                <div style={{ height: '1px', background: 'var(--border)', margin: '2px 0' }} />
              )}
              {hunk.added.map((line, i) => (
                <div key={`a-${i}`} className="diffLine diffAdded">
                  <span style={{ opacity: 0.5, marginRight: '8px', userSelect: 'none' }}>+</span>
                  {line}
                </div>
              ))}
              {hunk.removed.length === 0 && hunk.added.length === 0 && (
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>
                  File changed — raw diff not available from graph data
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiffViewerPage;
