import List from '../models/List.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';
import { createNotification } from '../utils/notifications.js';
import { getProjectForMember } from '../utils/projectAccess.js';

function sanitizeLabels(labels = []) {
  return labels.map((label) => label.trim()).filter(Boolean);
}

export async function moveTask({ task, toListId, newOrder = 0, actor, io }) {
  const fromListId = task.list;
  const fromList = await List.findById(fromListId);
  const toList = await List.findById(toListId);

  if (!toList || !fromList) {
    const error = new Error('List not found');
    error.statusCode = 404;
    throw error;
  }

  const targetIndex = Math.max(0, Number(newOrder));

  if (fromList._id.equals(toList._id)) {
    fromList.tasks = fromList.tasks.filter((id) => !id.equals(task._id));
    fromList.tasks.splice(targetIndex, 0, task._id);
    fromList.tasks.forEach((taskId, index) => {
      if (taskId.equals(task._id)) {
        task.order = index;
      }
    });
    await fromList.save();
  } else {
    fromList.tasks = fromList.tasks.filter((id) => !id.equals(task._id));
    toList.tasks = toList.tasks.filter((id) => !id.equals(task._id));
    toList.tasks.splice(targetIndex, 0, task._id);
    await fromList.save();
    await toList.save();
  }

  task.list = toList._id;
  task.order = targetIndex;
  await task.save();

  await logActivity({
    project: task.project,
    actor,
    action: `moved ${task.title}`,
    task: task._id,
    from: fromList.title,
    to: toList.title
  });

  io?.to(`project:${task.project}`).emit('task:moved', {
    taskId: task._id,
    fromListId,
    toListId: toList._id,
    newOrder: task.order
  });

  return task;
}

export const createTask = asyncHandler(async (req, res) => {
  const list = await List.findById(req.params.id).populate('board');
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }

  const project = await getProjectForMember(list.board.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const task = await Task.create({
    list: list._id,
    project: project._id,
    title: req.body.title,
    description: req.body.description,
    assignees: req.body.assignees || [],
    dueDate: req.body.dueDate,
    priority: req.body.priority || 'medium',
    labels: sanitizeLabels(req.body.labels),
    order: list.tasks.length,
    status: req.body.status || 'open',
    createdBy: req.user._id
  });

  list.tasks.push(task._id);
  await list.save();
  await notifyAssignees({ task, actorId: req.user._id, io: req.app.get('io') });
  await logActivity({ project: project._id, actor: req.user._id, action: `created task ${task.title}`, task: task._id });

  req.app.get('io')?.to(`project:${project._id}`).emit('task:created', task);
  res.status(201).json({ task });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignees', 'name email avatar')
    .populate('createdBy', 'name email avatar');

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await getProjectForMember(task.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  res.json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await getProjectForMember(task.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const previousAssignees = task.assignees.map((id) => id.toString());

  if (req.body.listId && req.body.order !== undefined) {
    await moveTask({
      task,
      toListId: req.body.listId,
      newOrder: req.body.order ?? task.order,
      actor: req.user._id,
      io: req.app.get('io')
    });
  }

  task.title = req.body.title ?? task.title;
  task.description = req.body.description ?? task.description;
  task.assignees = req.body.assignees ?? task.assignees;
  if (Object.prototype.hasOwnProperty.call(req.body, 'dueDate')) {
    task.dueDate = req.body.dueDate || undefined;
    task.reminderSent = false;
  }
  task.priority = req.body.priority ?? task.priority;
  task.labels = req.body.labels ? sanitizeLabels(req.body.labels) : task.labels;
  task.status = req.body.status ?? task.status;
  task.order = req.body.order ?? task.order;
  await task.save();

  await notifyAssignees({ task, actorId: req.user._id, io: req.app.get('io'), previousAssignees });
  await logActivity({ project: project._id, actor: req.user._id, action: `updated task ${task.title}`, task: task._id });

  req.app.get('io')?.to(`project:${project._id}`).emit('task:updated', task);
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = await getProjectForMember(task.project, req.user._id);
  if (!project) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  await Comment.deleteMany({ task: task._id });
  await List.updateOne({ _id: task.list }, { $pull: { tasks: task._id } });
  await task.deleteOne();
  await logActivity({ project: project._id, actor: req.user._id, action: `deleted task ${task.title}` });

  req.app.get('io')?.to(`project:${project._id}`).emit('task:deleted', { taskId: task._id, listId: task.list });
  res.json({ message: 'Task deleted' });
});

async function notifyAssignees({ task, actorId, io, previousAssignees = [] }) {
  const previous = new Set(previousAssignees);
  const assignees = task.assignees.map((id) => id.toString());
  const newlyAssigned = assignees.filter((id) => id !== actorId.toString() && !previous.has(id));

  await Promise.all(
    newlyAssigned.map((user) =>
      createNotification({
        io,
        user,
        type: 'assigned',
        message: `You were assigned to ${task.title}`,
        relatedTask: task._id,
        relatedProject: task.project
      })
    )
  );
}
