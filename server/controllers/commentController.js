import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';
import { createNotification } from '../utils/notifications.js';
import { getProjectForMember } from '../utils/projectAccess.js';

export const getComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await getProjectForMember(task.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const comments = await Comment.find({ task: task._id })
    .sort({ createdAt: 1 })
    .populate('user', 'name email avatar')
    .populate('mentions', 'name email avatar');

  res.json({ comments });
});

export const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await getProjectForMember(task.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const comment = await Comment.create({
    task: task._id,
    user: req.user._id,
    text: req.body.text,
    mentions: req.body.mentions || [],
    parentComment: req.body.parentComment
  });
  await comment.populate('user', 'name email avatar');
  await comment.populate('mentions', 'name email avatar');

  const watchers = new Set([
    task.createdBy.toString(),
    ...task.assignees.map((id) => id.toString())
  ]);
  watchers.delete(req.user._id.toString());

  await Promise.all(
    [...watchers].map((user) =>
      createNotification({
        io: req.app.get('io'),
        user,
        type: 'comment',
        message: `${req.user.name} commented on ${task.title}`,
        relatedTask: task._id,
        relatedProject: task.project
      })
    )
  );

  await Promise.all(
    (req.body.mentions || [])
      .filter((user) => user !== req.user._id.toString())
      .map((user) =>
        createNotification({
          io: req.app.get('io'),
          user,
          type: 'mention',
          message: `${req.user.name} mentioned you on ${task.title}`,
          relatedTask: task._id,
          relatedProject: task.project
        })
      )
  );

  await logActivity({ project: task.project, actor: req.user._id, action: `commented on ${task.title}`, task: task._id });
  req.app.get('io')?.to(`project:${task.project}`).emit('comment:added', comment);
  res.status(201).json({ comment });
});
