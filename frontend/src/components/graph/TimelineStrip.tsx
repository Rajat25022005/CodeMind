import { useNavigate } from 'react-router-dom';
import { mockTimelineItems } from '../../data/mockData';
import './TimelineStrip.css';

const TimelineStrip = () => {
  const navigate = useNavigate();

  return (
    <div className="timelineStrip">
      <div className="tlTitle">Recent Activity</div>
      {mockTimelineItems.map((item, idx) => (
        <div
          key={idx}
          className="tlItem"
          onClick={() => navigate('/timeline')}
          style={{ cursor: 'pointer' }}
        >
          <div
            className="tlDot"
            style={{
              background: item.bgColor,
              borderColor: item.color,
            }}
          />
          <div className="tlText">
            <strong>{item.title}</strong>
            {item.description}
          </div>
        </div>
      ))}
      <div
        className="tlViewAll"
        onClick={() => navigate('/timeline')}
      >
        View all activity →
      </div>
    </div>
  );
};

export default TimelineStrip;
