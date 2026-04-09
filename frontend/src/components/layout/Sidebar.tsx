import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { sidebarItems, sidebarSecondary, mockDriftItems } from '../../data/mockData';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleDrift } = useApp();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {sidebarItems.map((item) => (
        <button
          key={item.id}
          className={`sbBtn ${isActive(item.path) ? 'active' : ''}`}
          title={item.title}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
        </button>
      ))}
      <div className="sbDivider" />
      {sidebarSecondary.map((item) => (
        <button
          key={item.id}
          className={`sbBtn ${isActive(item.path) ? 'active' : ''}`}
          title={item.title}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
        </button>
      ))}
      <div className="sbDivider" />
      <button className="sbAlert" title="Drift Alerts" onClick={toggleDrift}>
        ⚠
        <span className="alertBadge">{mockDriftItems.length}</span>
      </button>
    </nav>
  );
};

export default Sidebar;
