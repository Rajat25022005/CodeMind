import { useState, useEffect } from 'react';
import { fetchCommits } from '../lib/api';
import { mockCommits } from '../data/repo.mock';
import type { CommitItem } from '../types';
import './Pages.css';

/**
 * CommitsPage — Scrollable commit history with graph node connections.
 */
const CommitsPage = () => {
  const [commits, setCommits] = useState<CommitItem[]>(mockCommits);

  useEffect(() => {
    fetchCommits()
      .then((res) => {
        if (res.commits && res.commits.length > 0) {
          const mapped = res.commits.map((c: any) => ({
            ...c,
            filesChanged: c.files_changed || 0,
            graphNodes: c.graph_nodes || 0,
          }));
          setCommits(mapped);
        }
      })
      .catch((err) => console.warn('Failed to fetch commits, using mock:', err));
  }, []);

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Commits</div>
        <div className="pageSubtitle">{commits.length} recent commits · Linked to knowledge graph</div>
      </div>

      <div className="pageContent">
        <div className="cardList">
          {commits.map((commit) => (
            <div key={commit.hash} className="commitRow">
              <span className="commitHash">{commit.hash}</span>
              <div className="commitBody">
                <div className="commitMsg">{commit.message}</div>
                <div className="commitInfo">
                  <span className="commitStat">👤 {commit.author}</span>
                  <span className="commitStat">📅 {commit.date}</span>
                  <span className="commitStat">📝 {commit.filesChanged} files</span>
                  <span className="commitStat" style={{ color: 'var(--cyan)' }}>
                    ⬡ {commit.graphNodes} nodes
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommitsPage;
