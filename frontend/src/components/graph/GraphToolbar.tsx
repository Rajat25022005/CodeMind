import './GraphToolbar.css';

interface GraphToolbarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const tools = [
  {
    id: 'graph',
    label: 'Graph',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      </svg>
    ),
  },
  {
    id: 'cluster',
    label: 'Cluster',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      </svg>
    ),
  },
  {
    id: 'filter',
    label: 'Filter',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
  },
];

const GraphToolbar = ({ activeView, onViewChange }: GraphToolbarProps) => {
  return (
    <div className="graphToolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`gtBtn ${activeView === tool.id ? 'active' : ''}`}
          onClick={() => onViewChange(tool.id)}
          title={tool.label}
        >
          {tool.icon}
          <span>{tool.label}</span>
        </button>
      ))}
    </div>
  );
};

export default GraphToolbar;
