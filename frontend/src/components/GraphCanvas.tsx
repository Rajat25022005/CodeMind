import { useState } from 'react';
import { useGraphStore } from '../stores/graphStore';
import GraphTabBar from './graph/GraphTabBar';
import GraphToolbar from './graph/GraphToolbar';
import GraphSVG from './graph/GraphSVG';
import GraphLegend from './graph/GraphLegend';
import NodeTooltip from './graph/NodeTooltip';
import TimelineStrip from './graph/TimelineStrip';
import ErrorBoundary from './ErrorBoundary';
import './GraphCanvas.css';

/**
 * GraphCanvas
 * Main graph visualization area composing the tab bar, SVG canvas,
 * toolbar, legend, tooltip, and timeline overlays.
 */
const GraphCanvas = () => {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const toggleNodeSelection = useGraphStore((s) => s.toggleNodeSelection);
  const [activeTab, setActiveTab] = useState('knowledge-graph');

  return (
    <>
      <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="graphArea" id="graph-canvas">
        <GraphToolbar />
        <ErrorBoundary>
          <GraphSVG activeNodeId={selectedNodeId} onNodeClick={toggleNodeSelection} />
        </ErrorBoundary>
        <GraphLegend />
        <NodeTooltip nodeId={selectedNodeId} />
        <TimelineStrip />
      </div>
    </>
  );
};

export default GraphCanvas;
