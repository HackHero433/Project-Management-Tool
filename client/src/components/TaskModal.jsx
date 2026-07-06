import { Send, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { taskApi } from '../api/endpoints';

function toDateInput(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default function TaskModal({ task, project, members, onClose, onSaved, socket }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    dueDate: toDateInput(task.dueDate),
    labels: (task.labels || []).join(', '),
    assignees: (task.assignees || []).map((assignee) => assignee._id)
  });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [mentions, setMentions] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    taskApi.comments(task._id).then(setComments);
  }, [task._id]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const onCommentAdded = (comment) => {
      if (comment.task === task._id) {
        setComments((current) => (current.some((item) => item._id === comment._id) ? current : [...current, comment]));
      }
    };

    const onTyping = (payload) => {
      if (payload.taskId !== task._id) {
        return;
      }

      setTypingUsers((current) => {
        const withoutUser = current.filter((user) => user.id !== payload.user.id);
        return payload.isTyping ? [...withoutUser, payload.user] : withoutUser;
      });
    };

    socket.on('comment:added', onCommentAdded);
    socket.on('typing:update', onTyping);
    return () => {
      socket.off('comment:added', onCommentAdded);
      socket.off('typing:update', onTyping);
    };
  }, [socket, task._id]);

  const memberOptions = useMemo(() => members || [], [members]);

  const updateTask = async (event) => {
    event.preventDefault();
    await taskApi.update(task._id, {
      title: form.title,
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate || null,
      labels: form.labels.split(',').map((label) => label.trim()).filter(Boolean),
      assignees: form.assignees
    });
    await onSaved();
  };

  const deleteTask = async () => {
    await taskApi.remove(task._id);
    await onSaved();
    onClose();
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) {
      return;
    }

    await taskApi.addComment(task._id, { text: commentText, mentions });
    setCommentText('');
    setMentions([]);
    socket?.emit('typing:stop', { projectId: project._id, taskId: task._id });
    await onSaved();
  };

  const toggleAssignee = (memberId) => {
    setForm((current) => ({
      ...current,
      assignees: current.assignees.includes(memberId)
        ? current.assignees.filter((id) => id !== memberId)
        : [...current.assignees, memberId]
    }));
  };

  const toggleMention = (memberId) => {
    setMentions((current) => (current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]));
  };

  const onCommentChange = (event) => {
    setCommentText(event.target.value);
    socket?.emit(event.target.value ? 'typing:start' : 'typing:stop', { projectId: project._id, taskId: task._id });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="task-modal" role="dialog" aria-modal="true" aria-label="Task details">
        <header className="modal-header">
          <h2>Task details</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close task" title="Close task">
            <X size={18} />
          </button>
        </header>

        <form className="task-form" onSubmit={updateTask}>
          <label>
            Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} />
          </label>
          <div className="form-grid">
            <label>
              Priority
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Due date
              <input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} type="date" />
            </label>
          </div>
          <label>
            Labels
            <input value={form.labels} onChange={(event) => setForm({ ...form, labels: event.target.value })} placeholder="design, backend" />
          </label>
          <fieldset>
            <legend>Assignees</legend>
            <div className="check-grid">
              {memberOptions.map((member) => (
                <label className="checkbox-label" key={member._id}>
                  <input checked={form.assignees.includes(member._id)} onChange={() => toggleAssignee(member._id)} type="checkbox" />
                  {member.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="modal-actions">
            <button type="submit">Save task</button>
            <button className="danger-button" type="button" onClick={deleteTask}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </form>

        <section className="comments">
          <h3>Comments</h3>
          {comments.map((comment) => (
            <article className="comment" key={comment._id}>
              <strong>{comment.user?.name || 'User'}</strong>
              <p>{comment.text}</p>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </article>
          ))}
          {!!typingUsers.length && <small>{typingUsers.map((user) => user.name).join(', ')} typing...</small>}
          <form className="comment-form" onSubmit={addComment}>
            <textarea value={commentText} onChange={onCommentChange} placeholder="Write a comment" rows={3} />
            <div className="mention-row">
              {memberOptions.map((member) => (
                <label className="checkbox-label" key={member._id}>
                  <input checked={mentions.includes(member._id)} onChange={() => toggleMention(member._id)} type="checkbox" />
                  @{member.name}
                </label>
              ))}
            </div>
            <button type="submit">
              <Send size={16} /> Comment
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}
