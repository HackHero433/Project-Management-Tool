import Board from '../models/Board.js';
import List from '../models/List.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';
import { getProjectForMember } from '../utils/projectAccess.js';

export const createList = asyncHandler(async (req, res) => {
  const project = await getProjectForMember(req.params.id, req.user._id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const board = await Board.findOne({ project: project._id });
  const listCount = await List.countDocuments({ board: board._id });
  const list = await List.create({ board: board._id, title: req.body.title, order: listCount });
  board.lists.push(list._id);
  await board.save();
  await logActivity({ project: project._id, actor: req.user._id, action: `created list ${list.title}` });

  req.app.get('io')?.to(`project:${project._id}`).emit('list:created', list);
  res.status(201).json({ list });
});

export const updateList = asyncHandler(async (req, res) => {
  const list = await List.findById(req.params.id).populate('board');
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }

  const project = await getProjectForMember(list.board.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  list.title = req.body.title ?? list.title;
  list.order = req.body.order ?? list.order;
  await list.save();
  await logActivity({ project: project._id, actor: req.user._id, action: `updated list ${list.title}` });

  req.app.get('io')?.to(`project:${project._id}`).emit('list:updated', list);
  res.json({ list });
});

export const deleteList = asyncHandler(async (req, res) => {
  const list = await List.findById(req.params.id).populate('board');
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }

  const project = await getProjectForMember(list.board.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const tasks = await Task.find({ list: list._id });
  await Comment.deleteMany({ task: { $in: tasks.map((task) => task._id) } });
  await Task.deleteMany({ list: list._id });
  await Board.updateOne({ _id: list.board._id }, { $pull: { lists: list._id } });
  await list.deleteOne();
  await logActivity({ project: project._id, actor: req.user._id, action: `deleted list ${list.title}` });

  req.app.get('io')?.to(`project:${project._id}`).emit('list:deleted', { listId: list._id });
  res.json({ message: 'List deleted' });
});
