import { Plus, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectApi } from '../api/endpoints';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    projectApi.all().then(setProjects).catch(() => setError('Could not load projects'));
  }, []);

  const createProject = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }

    const payload = await projectApi.create(form);
    navigate(`/projects/${payload.project._id}`);
  };

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Projects</h1>
          <span>Signed in as {user.name}</span>
        </div>
        <div className="topbar-actions">
          <NotificationBell />
          <button className="icon-button" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="dashboard-grid">
        <form className="panel" onSubmit={createProject}>
          <h2>Create project</h2>
          {error && <div className="alert">{error}</div>}
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} />
          </label>
          <button type="submit">
            <Plus size={16} /> Create
          </button>
        </form>

        <div className="project-list">
          {projects.map((project) => (
            <Link className="project-row" to={`/projects/${project._id}`} key={project._id}>
              <strong>{project.name}</strong>
              <span>{project.description || 'No description'}</span>
              <small>{project.members.length} members</small>
            </Link>
          ))}
          {!projects.length && <div className="empty-state">Create your first project to get a board.</div>}
        </div>
      </section>
    </main>
  );
}
