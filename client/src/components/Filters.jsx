export default function Filters({ filters, setFilters, members }) {
  return (
    <div className="filters">
      <input
        value={filters.search}
        onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        placeholder="Search tasks"
      />
      <select value={filters.assignee} onChange={(event) => setFilters({ ...filters, assignee: event.target.value })}>
        <option value="">All assignees</option>
        {members.map((member) => (
          <option value={member._id} key={member._id}>
            {member.name}
          </option>
        ))}
      </select>
      <select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={filters.assignedToMe}
          onChange={(event) => setFilters({ ...filters, assignedToMe: event.target.checked })}
        />
        Assigned to me
      </label>
    </div>
  );
}
