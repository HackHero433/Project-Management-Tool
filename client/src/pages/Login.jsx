import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not sign in');
    }
  };

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1>Sign in</h1>
        <p>Open your collaborative project workspace.</p>
        {error && <div className="alert">{error}</div>}
        <label>
          Email
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
        </label>
        <label>
          Password
          <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required />
        </label>
        <button type="submit">Sign in</button>
        <span>
          New here? <Link to="/register">Create an account</Link>
        </span>
      </form>
    </main>
  );
}
