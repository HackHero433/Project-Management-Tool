import { CalendarDays, MessageCircle } from 'lucide-react';

export default function TaskCard({ task, onClick }) {
  return (
    <button className="task-card" onClick={onClick} type="button">
      <strong>{task.title}</strong>
      {task.description && <p>{task.description}</p>}
      <div className="task-meta">
        <span className={`priority ${task.priority}`}>{task.priority}</span>
        {task.dueDate && (
          <span>
            <CalendarDays size={14} /> {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        <span>
          <MessageCircle size={14} /> Details
        </span>
      </div>
      <div className="avatar-row">
        {(task.assignees || []).slice(0, 4).map((user) => (
          <span className="avatar" title={user.name} key={user._id}>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        ))}
      </div>
      {!!task.labels?.length && (
        <div className="label-row">
          {task.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}
    </button>
  );
}
