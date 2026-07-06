import jwt from 'jsonwebtoken';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { moveTask } from '../controllers/taskController.js';
import { createNotification } from '../utils/notifications.js';
import { getProjectForMember } from '../utils/projectAccess.js';

const presence = new Map();

function parseCookie(header = '', name) {
  return header
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([key]) => key === name)?.[1];
}

export function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || parseCookie(socket.handshake.headers.cookie, 'accessToken');
      if (!token) {
        return next(new Error('Not authenticated'));
      }

      const decoded = jwt.verify(decodeURIComponent(token), process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.join(`user:${user._id}`);
      next();
    } catch (error) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const joinedProjects = new Set();

    socket.on('join-project', async ({ projectId }) => {
      const project = await getProjectForMember(projectId, socket.user._id);
      if (!project) {
        return;
      }

      const room = `project:${projectId}`;
      socket.join(room);
      joinedProjects.add(projectId);

      const users = presence.get(projectId) || new Map();
      users.set(socket.user._id.toString(), {
        id: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        avatar: socket.user.avatar
      });
      presence.set(projectId, users);
      io.to(room).emit('presence:update', [...users.values()]);
    });

    socket.on('task:move', async ({ taskId, toListId, newOrder }) => {
      const task = await Task.findById(taskId);
      if (!task || !(await getProjectForMember(task.project, socket.user._id))) {
        return;
      }

      await moveTask({ task, toListId, newOrder, actor: socket.user._id, io });
    });

    socket.on('comment:add', async ({ taskId, text, mentions = [] }) => {
      const task = await Task.findById(taskId);
      if (!task || !(await getProjectForMember(task.project, socket.user._id)) || !text?.trim()) {
        return;
      }

      const comment = await Comment.create({ task: task._id, user: socket.user._id, text, mentions });
      await comment.populate('user', 'name email avatar');
      io.to(`project:${task.project}`).emit('comment:added', comment);

      await Promise.all(
        mentions.map((user) =>
          createNotification({
            io,
            user,
            type: 'mention',
            message: `${socket.user.name} mentioned you on ${task.title}`,
            relatedTask: task._id,
            relatedProject: task.project
          })
        )
      );
    });

    socket.on('typing:start', ({ projectId, taskId }) => {
      socket.to(`project:${projectId}`).emit('typing:update', {
        taskId,
        user: { id: socket.user._id, name: socket.user.name },
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ projectId, taskId }) => {
      socket.to(`project:${projectId}`).emit('typing:update', {
        taskId,
        user: { id: socket.user._id, name: socket.user.name },
        isTyping: false
      });
    });

    socket.on('disconnect', () => {
      joinedProjects.forEach((projectId) => {
        const users = presence.get(projectId);
        users?.delete(socket.user._id.toString());
        io.to(`project:${projectId}`).emit('presence:update', [...(users?.values() || [])]);
      });
    });
  });
}
