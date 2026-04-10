import { mockStats } from '../../data/repo.mock';
import './BottomStrip.css';

const BottomStrip = () => {
  return (
    <footer className="bottomStrip">
      <div className="bsItem">
        🧠 <span className="bsHighlight">{mockStats.nodes.toLocaleString()}</span> nodes
      </div>
      <div className="bsItem">
        ⬡ <span className="bsHighlight">{mockStats.edges.toLocaleString()}</span> edges
      </div>
      <div className="bsItem">
        🔀 <span className="bsHighlight">{mockStats.commits.toLocaleString()}</span> commits indexed
      </div>
      <div className="bsItem">
        📦 Ollama <span className="bsHighlight">{mockStats.model}</span> · local
      </div>
      <div className="bsItem">
        ⚡ <span className="bsHighlight">{mockStats.avgQuery}</span> avg query
      </div>
      <div className="bsDrift">
        <div className="bsDriftDot" />
        {mockStats.driftCount} intent drifts active
      </div>
    </footer>
  );
};

export default BottomStrip;
