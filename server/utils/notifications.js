import Notification from '../models/Notification.js';

export async function createNotification({ io, user, type, message, relatedTask, relatedProject }) {
  const notification = await Notification.create({
    user,
    type,
    message,
    relatedTask,
    relatedProject
  });

  io?.to(`user:${user.toString()}`).emit('notification:new', notification);
  return notification;
}
