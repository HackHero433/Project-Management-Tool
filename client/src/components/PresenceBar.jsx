export default function PresenceBar({ users }) {
  return (
    <div className="presence" title="Live viewers">
      {users.slice(0, 5).map((user) => (
        <span className="avatar online" key={user.id || user._id} title={user.name}>
          {user.name.slice(0, 1).toUpperCase()}
        </span>
      ))}
      {!!users.length && <small>{users.length} online</small>}
    </div>
  );
}
