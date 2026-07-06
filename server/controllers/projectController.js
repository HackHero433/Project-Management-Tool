import Activity from '../models/Activity.js';
import Board from '../models/Board.js';
import Comment from '../models/Comment.js';
import List from '../models/List.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';
import { createNotification } from '../utils/notifications.js';
import { getProjectForMember, requireProjectRole } from '../utils/projectAccess.js';

async function getProjectPayload(projectId) {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');
  const board = await Board.findOne({ project: projectId }).populate({
    path: 'lists',
    options: { sort: { order: 1 } },
    populate: {
      path: 'tasks',
      options: { sort: { order: 1 } },
      populate: [
        { path: 'assignees', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' }
      ]
    }
  });
  const activity = await Activity.find({ project: projectId })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('actor', 'name email avatar')
    .populate('task', 'title');

  return { project, board, activity };
}

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user._id })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

  res.json({ projects });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }]
  });
  const board = await Board.create({ project: project._id, name: `${name} board` });
  const defaults = await List.insertMany([
    { board: board._id, title: 'To Do', order: 0 },
    { board: board._id, title: 'In Progress', order: 1 },
    { board: board._id, title: 'Done', order: 2 }
  ]);

  board.lists = defaults.map((list) => list._id);
  await board.save();
  await logActivity({ project: project._id, actor: req.user._id, action: 'created project' });

  res.status(201).json(await getProjectPayload(project._id));
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectForMember(req.params.id, req.user._id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  res.json(await getProjectPayload(req.params.id));
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await requireProjectRole(req.params.id, req.user._id, ['owner', 'admin']);
  project.name = req.body.name ?? project.name;
  project.description = req.body.description ?? project.description;
  await project.save();
  await logActivity({ project: project._id, actor: req.user._id, action: 'updated project' });

  req.app.get('io')?.to(`project:${project._id}`).emit('project:updated', await getProjectPayload(project._id));
  res.json(await getProjectPayload(project._id));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await requireProjectRole(req.params.id, req.user._id, ['owner']);
  const boards = await Board.find({ project: project._id });
  const lists = await List.find({ board: { $in: boards.map((board) => board._id) } });
  const tasks = await Task.find({ project: project._id });

  await Comment.deleteMany({ task: { $in: tasks.map((task) => task._id) } });
  await Task.deleteMany({ project: project._id });
  await List.deleteMany({ _id: { $in: lists.map((list) => list._id) } });
  await Board.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ message: 'Project deleted' });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const project = await requireProjectRole(req.params.id, req.user._id, ['owner', 'admin']);
  const { email, role = 'member' } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'No user found with that email' });
  }

  const alreadyMember = project.members.some((member) => member.user.equals(user._id));
  if (!alreadyMember) {
    project.members.push({ user: user._id, role });
    await project.save();
  }

  await createNotification({
    io: req.app.get('io'),
    user: user._id,
    type: 'invited',
    message: `You were added to ${project.name}`,
    relatedProject: project._id
  });
  await logActivity({ project: project._id, actor: req.user._id, action: `invited ${user.name}` });

  req.app.get('io')?.to(`project:${project._id}`).emit('project:updated', await getProjectPayload(project._id));
  res.json(await getProjectPayload(project._id));
});

export const removeMember = asyncHandler(async (req, res) => {
  const project = await requireProjectRole(req.params.id, req.user._id, ['owner', 'admin']);

  if (project.owner.equals(req.params.userId)) {
    return res.status(400).json({ message: 'Project owner cannot be removed' });
  }

  project.members = project.members.filter((member) => !member.user.equals(req.params.userId));
  await project.save();
  await logActivity({ project: project._id, actor: req.user._id, action: 'removed a member' });

  req.app.get('io')?.to(`project:${project._id}`).emit('project:updated', await getProjectPayload(project._id));
  res.json(await getProjectPayload(project._id));
});
