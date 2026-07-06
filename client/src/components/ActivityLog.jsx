export default function ActivityLog({ activity = [] }) {
  return (
    <aside className="activity-log">
      <h2>Activity</h2>
      {activity.map((item) => (
        <div className="activity-item" key={item._id}>
          <strong>{item.actor?.name || 'Someone'}</strong> {item.action}
          {item.to && <span> to {item.to}</span>}
          <small>{new Date(item.createdAt).toLocaleString()}</small>
        </div>
      ))}
      {!activity.length && <div className="empty-state">No activity yet.</div>}
    </aside>
  );
}
