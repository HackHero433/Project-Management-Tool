import Activity from '../models/Activity.js';

export async function logActivity({ project, actor, action, task, from, to, metadata = {} }) {
  return Activity.create({ project, actor, action, task, from, to, metadata });
}
