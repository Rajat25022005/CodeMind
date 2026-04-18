import { nodeTooltipData, graphNodes } from '../../data/mockData';
import './NodeTooltip.css';

interface NodeTooltipProps {
  nodeId: string | null;
}

const NodeTooltip = ({ nodeId }: NodeTooltipProps) => {
  if (!nodeId) return null;

  const data = nodeTooltipData[nodeId];
  if (!data) return null;

  // Position tooltip near the node
  const node = graphNodes.find((n) => n.id === nodeId);
  if (!node) return null;

  // Calculate position offset — place tooltip to the right of node
  const leftPct = Math.min(node.x * 100 + 5, 65);
  const topPct = Math.max(node.y * 100 - 10, 5);

  return (
    <div
      className="nodeTooltip"
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
    >
      <div className="ntHeader">
        <div className="ntIcon">{data.icon}</div>
        <div>
          <div className="ntTitle">{data.title}</div>
          <div className="ntSub">{data.subtitle}</div>
        </div>
      </div>
      {data.rows.map((row) => (
        <div key={row.label} className="ntRow">
          <span>{row.label}</span>
          <span className={row.highlight ? 'ntValHighlight' : 'ntVal'}>{row.value}</span>
        </div>
      ))}
      {data.driftTag && (
        <span className="ntTag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {data.driftTag.replace(/^⚠\s*/, '')}
        </span>
      )}
    </div>
  );
};

export default NodeTooltip;
