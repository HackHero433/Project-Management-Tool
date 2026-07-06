import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectApi } from '../api/endpoints';
import ActivityLog from '../components/ActivityLog';
import Board from '../components/Board';
import Filters from '../components/Filters';
import MemberInvite from '../components/MemberInvite';
import NotificationBell from '../components/NotificationBell';
import PresenceBar from '../components/PresenceBar';
import TaskModal from '../components/TaskModal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function ProjectBoard() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [presence, setPresence] = useState([]);
  const [filters, setFilters] = useState({ search: '', assignee: '', priority: '', assignedToMe: false });
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [error, setError] = useState('');

  const loadProject = useCallback(async () => {
    const payload = await projectApi.get(projectId);
    setData(payload);
  }, [projectId]);

  useEffect(() => {
    loadProject().catch(() => setError('Could not load project'));
  }, [loadProject]);

  useEffect(() => {
    if (!socket || !projectId) {
      return undefined;
    }

    socket.emit('join-project', { projectId });
    socket.on('presence:update', setPresence);

    const refetchEvents = ['task:created', 'task:moved', 'task:updated', 'task:deleted', 'list:created', 'list:updated', 'list:deleted', 'project:updated'];
    refetchEvents.forEach((eventName) => socket.on(eventName, loadProject));

    return () => {
      socket.off('presence:update', setPresence);
      refetchEvents.forEach((eventName) => socket.off(eventName, loadProject));
    };
  }, [socket, projectId, loadProject]);

  const members = data?.project?.members?.map((member) => member.user) || [];
  const selectedTask = useMemo(() => {
    if (!data?.board?.lists) {
      return null;
    }

    return data.board.lists.flatMap((list) => list.tasks || []).find((task) => task._id === selectedTaskId);
  }, [data, selectedTaskId]);

  const createList = async (event) => {
    event.preventDefault();
    if (!newListTitle.trim()) {
      return;
    }

    await projectApi.createList(projectId, { title: newListTitle });
    setNewListTitle('');
    await loadProject();
  };

  if (error) {
    return <div className="page-message">{error}</div>;
  }

  if (!data) {
    return <div className="page-message">Loading board...</div>;
  }

  return (
    <main className="workspace">
      <header className="board-header">
        <div className="board-title">
          <Link to="/" className="icon-button" aria-label="Back to projects" title="Back to projects">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1>{data.project.name}</h1>
            <span>{data.project.description || 'Project board'}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <PresenceBar users={presence} />
          <NotificationBell />
          <button className="icon-button" onClick={loadProject} aria-label="Refresh board" title="Refresh board">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <div className="board-tools">
        <Filters filters={filters} setFilters={setFilters} members={members} />
        <MemberInvite projectId={projectId} onInvite={loadProject} />
        <form className="inline-form" onSubmit={createList}>
          <input value={newListTitle} onChange={(event) => setNewListTitle(event.target.value)} placeholder="New list" />
          <button type="submit">
            <Plus size={16} /> Add list
          </button>
        </form>
      </div>

      <Board
        data={data}
        filters={filters}
        currentUser={user}
        setData={setData}
        onOpenTask={setSelectedTaskId}
        onReload={loadProject}
      />

      <ActivityLog activity={data.activity} />

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          project={data.project}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onSaved={loadProject}
          socket={socket}
        />
      )}
    </main>
  );
}
