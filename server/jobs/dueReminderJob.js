import cron from 'node-cron';
import Task from '../models/Task.js';
import { createNotification } from '../utils/notifications.js';

export function startDueReminderJob(io) {
  cron.schedule('*/30 * * * *', async () => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: in24Hours },
      reminderSent: false,
      assignees: { $exists: true, $ne: [] }
    });

    await Promise.all(
      tasks.flatMap((task) =>
        task.assignees.map((user) =>
          createNotification({
            io,
            user,
            type: 'due-soon',
            message: `${task.title} is due soon`,
            relatedTask: task._id,
            relatedProject: task.project
          })
        )
      )
    );

    await Task.updateMany({ _id: { $in: tasks.map((task) => task._id) } }, { reminderSent: true });
  });
}
