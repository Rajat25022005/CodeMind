import { mockTimelineItems } from '../../data/timeline.mock';
import './TimelineStrip.css';

const TimelineStrip = () => {
  return (
    <div className="timelineStrip">
      <div className="tlTitle">Recent Activity</div>
      {mockTimelineItems.map((item, idx) => (
        <div key={idx} className="tlItem">
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
    </div>
  );
};

export default TimelineStrip;
