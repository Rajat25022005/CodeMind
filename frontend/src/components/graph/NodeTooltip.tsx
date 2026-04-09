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
      {data.driftTag && <span className="ntTag">{data.driftTag}</span>}
    </div>
  );
};

export default NodeTooltip;
