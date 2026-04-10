import { graphTabs } from '../../data/repo.mock';
import './GraphTabBar.css';

interface GraphTabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const GraphTabBar = ({ activeTab, onTabChange }: GraphTabBarProps) => {
  return (
    <div className="tabbar" role="tablist">
      {graphTabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tabDot" style={{ background: tab.color }} />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default GraphTabBar;
