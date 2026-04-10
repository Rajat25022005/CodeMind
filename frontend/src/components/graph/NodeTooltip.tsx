import { useRef, useEffect, useState } from 'react';
import { nodeTooltipData, graphNodes } from '../../data/graph.mock';
import './NodeTooltip.css';

interface NodeTooltipProps {
  nodeId: string | null;
}

/**
 * NodeTooltip — Dynamically positioned tooltip that clamps to graph bounds
 * using getBoundingClientRect instead of hardcoded percentages.
 */
const NodeTooltip = ({ nodeId }: NodeTooltipProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!nodeId || !tooltipRef.current) return;

    const node = graphNodes.find((n) => n.id === nodeId);
    if (!node) return;

    const parent = tooltipRef.current.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Calculate initial position (offset to the right of the node)
    let left = node.x * parentRect.width + 20;
    let top = node.y * parentRect.height - 40;

    // Clamp right edge
    if (left + tooltipRect.width > parentRect.width - 8) {
      left = node.x * parentRect.width - tooltipRect.width - 20;
    }
    // Clamp left edge
    if (left < 8) left = 8;
    // Clamp bottom edge
    if (top + tooltipRect.height > parentRect.height - 8) {
      top = parentRect.height - tooltipRect.height - 8;
    }
    // Clamp top edge
    if (top < 8) top = 8;

    setPos({ left, top });
  }, [nodeId]);

  if (!nodeId) return null;
  const data = nodeTooltipData[nodeId];
  if (!data) return null;

  return (
    <div
      ref={tooltipRef}
      className="nodeTooltip"
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
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
