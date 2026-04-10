import { useMemo, useCallback } from 'react';
import { graphNodes, graphEdges, nodeColors, edgeColors } from '../../data/graph.mock';
import './GraphSVG.css';

interface GraphSVGProps {
  activeNodeId: string | null;
  onNodeClick: (id: string) => void;
}

/**
 * GraphSVG — Declarative React SVG rendering.
 * All nodes, edges, and filters are JSX elements (no imperative DOM mutation).
 * Event handlers are React synthetic events — automatically cleaned up.
 */
const GraphSVG = ({ activeNodeId, onNodeClick }: GraphSVGProps) => {
  // Compute which edge indices are connected to the active node
  const activeEdgeSet = useMemo(() => {
    if (!activeNodeId) return new Set<number>();
    const set = new Set<number>();
    graphEdges.forEach((e, idx) => {
      if (e.from === activeNodeId || e.to === activeNodeId) set.add(idx);
    });
    return set;
  }, [activeNodeId]);

  const getNodePos = useCallback(
    (id: string) => {
      const n = graphNodes.find((n) => n.id === id);
      return n ? { x: n.x, y: n.y } : null;
    },
    []
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg
        className="graphSvg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Glow filters */}
        <defs>
          {graphNodes.map((n) => (
            <filter
              key={`glow_${n.id}`}
              id={`glow_${n.id}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="0.008"
                floodColor={nodeColors[n.type] || '#fff'}
                floodOpacity="0.7"
              />
            </filter>
          ))}
        </defs>

        {/* Edges */}
        {graphEdges.map((e, idx) => {
          const from = getNodePos(e.from);
          const to = getNodePos(e.to);
          if (!from || !to) return null;

          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2 - 0.04;
          const isHighlighted = activeEdgeSet.has(idx);
          const baseColor = edgeColors[e.type] || 'rgba(255,255,255,0.1)';
          const color = isHighlighted
            ? baseColor.replace(/[\d.]+\)$/, '0.7)')
            : baseColor;

          // Arrowhead calculation
          const dx = to.x - mx;
          const dy = to.y - my;
          const len = Math.sqrt(dx * dx + dy * dy) || 0.001;
          const arrowSize = 0.018;
          const perpSize = 0.006;
          const ax = to.x - (dx / len) * arrowSize;
          const ay = to.y - (dy / len) * arrowSize;
          const px = (-dy / len) * perpSize;
          const py = (dx / len) * perpSize;

          return (
            <g key={`edge-${idx}`}>
              <path
                d={`M${from.x},${from.y} Q${mx},${my} ${to.x},${to.y}`}
                fill="none"
                stroke={color}
                strokeWidth={isHighlighted ? 0.004 : 0.002}
                className="animatedEdge"
              />
              <polygon
                points={`${to.x},${to.y} ${ax + px},${ay + py} ${ax - px},${ay - py}`}
                fill={color}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {graphNodes.map((n) => {
          const col = nodeColors[n.type] || '#fff';
          const r = n.type === 'module' ? 0.018 : n.type === 'commit' ? 0.012 : 0.015;
          const isActive = n.id === activeNodeId;

          return (
            <g
              key={n.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onNodeClick(n.id)}
            >
              {/* Hover/active ring */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r + (isActive ? 0.012 : 0.008)}
                fill="none"
                stroke={col}
                strokeWidth={0.002}
                opacity={isActive ? 0.25 : 0}
                className="nodeHoverRing"
              />

              {/* Node circle */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={col + '22'}
                stroke={col}
                strokeWidth={isActive ? 0.004 : 0.002}
                filter={isActive ? `url(#glow_${n.id})` : undefined}
              />

              {/* Label */}
              <text
                x={n.x}
                y={n.y + r + 0.022}
                textAnchor="middle"
                fontFamily="IBM Plex Mono, monospace"
                fontSize="0.014"
                fill={isActive ? col : 'rgba(160,170,185,0.75)'}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GraphSVG;
