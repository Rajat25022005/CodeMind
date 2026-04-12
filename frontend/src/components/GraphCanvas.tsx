import { useState } from 'react';
import { useGraphStore } from '../stores/graphStore';
import { useGraphUpdates } from '../hooks/useGraphUpdates';
import GraphTabBar from './graph/GraphTabBar';
import GraphToolbar from './graph/GraphToolbar';
import ForceGraphVisualizer from './graph/ForceGraphVisualizer';
import GraphLegend from './graph/GraphLegend';
import NodeTooltip from './graph/NodeTooltip';
import TimelineStrip from './graph/TimelineStrip';
import ErrorBoundary from './ErrorBoundary';
import './GraphCanvas.css';

/**
 * GraphCanvas
 * Main graph visualization area composing the tab bar, Canvas Graph,
 * toolbar, legend, tooltip, timeline overlays, and ingestion progress.
 */
const GraphCanvas = () => {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const toggleNodeSelection = useGraphStore((s) => s.toggleNodeSelection);
  const [activeTab, setActiveTab] = useState('knowledge-graph');
  const { ingestion } = useGraphUpdates();

  return (
    <>
      <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="graphArea" id="graph-canvas">
        <GraphToolbar />

        {/* Ingestion progress bar */}
        {ingestion.active && (
          <div className="ingestionBar">
            <div className="ingestionBarFill" style={{ width: `${Math.round(ingestion.progress * 100)}%` }} />
            <span className="ingestionBarLabel">
              ⏳ {ingestion.stage} — {Math.round(ingestion.progress * 100)}%
            </span>
          </div>
        )}

        <ErrorBoundary>
          <ForceGraphVisualizer activeNodeId={selectedNodeId} onNodeClick={toggleNodeSelection} />
        </ErrorBoundary>
        <GraphLegend />
        <NodeTooltip nodeId={selectedNodeId} />
        <TimelineStrip />
      </div>
    </>
  );
};

export default GraphCanvas;
