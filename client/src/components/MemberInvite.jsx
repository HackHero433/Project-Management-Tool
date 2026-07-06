import { useState } from 'react';
import { projectApi } from '../api/endpoints';

export default function MemberInvite({ projectId, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      await projectApi.invite(projectId, { email, role });
      setEmail('');
      setMessage('Member added');
      await onInvite();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Invite failed');
    }
  };

  return (
    <form className="inline-form" onSubmit={submit}>
      <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Invite by email" type="email" required />
      <select value={role} onChange={(event) => setRole(event.target.value)}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Invite</button>
      {message && <small>{message}</small>}
    </form>
  );
}
