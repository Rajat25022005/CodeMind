import { mockCommits } from '../data/repo.mock';
import './Pages.css';

/**
 * CommitsPage — Scrollable commit history with graph node connections.
 */
const CommitsPage = () => {
  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Commits</div>
        <div className="pageSubtitle">{mockCommits.length} recent commits · Linked to knowledge graph</div>
      </div>

      <div className="pageContent">
        <div className="cardList">
          {mockCommits.map((commit) => (
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
