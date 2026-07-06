import Project from '../models/Project.js';

export async function getProjectForMember(projectId, userId) {
  return Project.findOne({
    _id: projectId,
    'members.user': userId
  });
}

export async function requireProjectRole(projectId, userId, allowedRoles) {
  const project = await Project.findOne({
    _id: projectId,
    members: { $elemMatch: { user: userId, role: { $in: allowedRoles } } }
  });

  if (!project) {
    const error = new Error('You do not have permission for this project');
    error.statusCode = 403;
    throw error;
  }

  return project;
}
