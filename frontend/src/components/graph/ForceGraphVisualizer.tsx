import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { fetchGraph } from '../../lib/api';
import { nodeColors, edgeColors, graphNodes as mockGraphNodes, graphEdges as mockGraphEdges } from '../../data/graph.mock';

interface ForceGraphVisualizerProps {
  activeNodeId: string | null;
  onNodeClick: (id: string) => void;
}

export default function ForceGraphVisualizer({ activeNodeId, onNodeClick }: ForceGraphVisualizerProps) {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGraph()
      .then((res) => {
        if (res.nodes && res.edges) {
          const formattedLinks = res.edges.map((e: any) => ({
            ...e,
            source: e.from || e.from_id,
            target: e.to || e.to_id,
          }));
          setGraphData({ nodes: res.nodes, links: formattedLinks });
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch graph:', err);
        // Fallback to mock data if API is down
        const formattedMockLinks = mockGraphEdges.map((e: any) => ({
            ...e,
            source: e.from,
            target: e.to,
        }));
        setGraphData({ nodes: mockGraphNodes, links: formattedMockLinks });
      });
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const activeEdgeSet = useMemo(() => {
    const set = new Set<string>();
    if (!activeNodeId) return set;
    graphData.links.forEach((l) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      if (sourceId === activeNodeId || targetId === activeNodeId) {
        set.add(`${sourceId}-${targetId}`);
      }
    });
    return set;
  }, [activeNodeId, graphData]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label || '';
    const type = node.type || 'module';
    const isActive = node.id === activeNodeId;
    const col = nodeColors[type] || '#fff';
    
    const r = type === 'module' ? 6 : type === 'commit' ? 4 : 5;
    
    if (isActive) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = col + '40';
      ctx.fill();
    }
    
    ctx.shadowColor = col;
    ctx.shadowBlur = isActive ? 15 : 8;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = col + '22';
    ctx.fill();
    ctx.lineWidth = isActive ? 1.5 : 0.8;
    ctx.strokeStyle = col;
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    if (globalScale > 2 || isActive) {
      const fontSize = Math.max(3, 12 / globalScale);
      ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? col : 'rgba(160,170,185,0.75)';
      ctx.fillText(label, node.x, node.y + r + fontSize + 2);
    }
  }, [activeNodeId]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const source = (typeof link.source === 'object' ? link.source : { x: 0, y: 0 }) as { x: number, y: number, id?: string };
    const target = (typeof link.target === 'object' ? link.target : { x: 0, y: 0 }) as { x: number, y: number, id?: string };
    
    const isHighlighted = activeEdgeSet.has(`${source.id}-${target.id}`);
    const baseColor = edgeColors[link.type] || 'rgba(255,255,255,0.1)';
    const color = isHighlighted ? baseColor.replace(/[\d.]+\)$/, '0.7)') : baseColor;
    
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = isHighlighted ? 1.5 : 0.5;
    ctx.stroke();

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const arrowSize = 4;
      const targetR = link.target?.type === 'module' ? 6 : link.target?.type === 'commit' ? 4 : 5;
      const ax = target.x - (dx / len) * (targetR + arrowSize);
      const ay = target.y - (dy / len) * (targetR + arrowSize);
      
      const px = (-dy / len) * arrowSize * 0.5;
      const py = (dx / len) * arrowSize * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(ax + px, ay + py);
      ctx.lineTo(target.x - (dx / len) * targetR, target.y - (dy / len) * targetR);
      ctx.lineTo(ax - px, ay - py);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [activeEdgeSet]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-card)' }} ref={containerRef}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          nodeId="id"
          onNodeClick={(node) => onNodeClick((node as any).id)}
          d3VelocityDecay={0.2}
          backgroundColor="transparent"
          warmupTicks={100}
          cooldownTicks={0}
        />
      )}
    </div>
  );
}
