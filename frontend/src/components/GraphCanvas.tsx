import { useState } from 'react';
import { useApp } from '../context/AppContext';
import GraphTabBar from './graph/GraphTabBar';
import GraphToolbar from './graph/GraphToolbar';
import GraphSVG from './graph/GraphSVG';
import GraphLegend from './graph/GraphLegend';
import NodeTooltip from './graph/NodeTooltip';
import TimelineStrip from './graph/TimelineStrip';
import './GraphCanvas.css';

/**
 * GraphCanvas
 * Main graph visualization area composing the tab bar, SVG canvas,
 * toolbar, legend, tooltip, and timeline overlays.
 */
const GraphCanvas = () => {
  const { selectedNodeId, setSelectedNodeId } = useApp();
  const [activeTab, setActiveTab] = useState('knowledge-graph');
  const [viewMode, setViewMode] = useState('graph');

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(selectedNodeId === id ? null : id);
  };

  return (
    <>
      <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="graphArea" id="graph-canvas">
        <GraphToolbar activeView={viewMode} onViewChange={setViewMode} />
        <GraphSVG activeNodeId={selectedNodeId} onNodeClick={handleNodeClick} viewMode={viewMode} />
        <GraphLegend />
        <NodeTooltip nodeId={selectedNodeId} />
        <TimelineStrip />
      </div>
    </>
  );
};

export default GraphCanvas;
