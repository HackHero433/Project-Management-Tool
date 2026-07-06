import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await register(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create account');
    }
  };

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create account</h1>
        <p>Start a workspace with live boards and task discussions.</p>
        {error && <div className="alert">{error}</div>}
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          Email
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
        </label>
        <label>
          Password
          <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength={6} required />
        </label>
        <button type="submit">Create account</button>
        <span>
          Already registered? <Link to="/login">Sign in</Link>
        </span>
      </form>
    </main>
  );
}
