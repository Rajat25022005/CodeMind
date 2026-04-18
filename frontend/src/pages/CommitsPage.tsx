import { useNavigate } from 'react-router-dom';
import { mockCommits } from '../data/mockData';
import './Pages.css';

/**
 * CommitsPage — Scrollable commit history with graph node connections.
 */
const CommitsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Commits</div>
        <div className="pageSubtitle">{mockCommits.length} recent commits · Linked to knowledge graph</div>
      </div>

      <div className="pageContent">
        <div className="cardList">
          {mockCommits.map((commit) => (
            <div
              key={commit.hash}
              className="commitRow"
              onClick={() => navigate('/diff')}
              style={{ cursor: 'pointer' }}
            >
              <span className="commitHash">{commit.hash}</span>
              <div className="commitBody">
                <div className="commitMsg">{commit.message}</div>
                <div className="commitInfo">
                  <span className="commitStat">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    {commit.author}
                  </span>
                  <span className="commitStat">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {commit.date}
                  </span>
                  <span className="commitStat">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    {commit.filesChanged} files
                  </span>
                  <span className="commitStat" style={{ color: 'var(--cyan)' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
                      <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
                    </svg>
                    {commit.graphNodes} nodes
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
