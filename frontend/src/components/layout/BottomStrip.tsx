import { useState, useEffect } from 'react';
import { mockStats } from '../../data/repo.mock';
import { fetchStatus } from '../../lib/api';
import type { StatusStats } from '../../types';
import './BottomStrip.css';

const BottomStrip = () => {
  const [stats, setStats] = useState<StatusStats>(mockStats);

  useEffect(() => {
    fetchStatus()
      .then((res) => {
        setStats({
          nodes: res.nodes ?? 0,
          edges: res.edges ?? 0,
          commits: res.commits ?? 0,
          model: res.model || 'unknown',
          avgQuery: `${Math.round(res.avg_query_ms || 0)}ms`,
          driftCount: res.drift_count ?? 0,
        });
      })
      .catch((err) => console.warn('Failed to fetch status, using mock:', err));
  }, []);

  return (
    <footer className="bottomStrip">
      <div className="bsItem">
        🧠 <span className="bsHighlight">{stats.nodes.toLocaleString()}</span> nodes
      </div>
      <div className="bsItem">
        ⬡ <span className="bsHighlight">{stats.edges.toLocaleString()}</span> edges
      </div>
      <div className="bsItem">
        🔀 <span className="bsHighlight">{stats.commits.toLocaleString()}</span> commits indexed
      </div>
      <div className="bsItem">
        📦 Ollama <span className="bsHighlight">{stats.model}</span> · local
      </div>
      <div className="bsItem">
        ⚡ <span className="bsHighlight">{stats.avgQuery}</span> avg query
      </div>
      <div className="bsDrift">
        <div className="bsDriftDot" />
        {stats.driftCount} intent drifts active
      </div>
    </footer>
  );
};

export default BottomStrip;
