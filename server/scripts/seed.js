import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import Board from '../models/Board.js';
import Comment from '../models/Comment.js';
import List from '../models/List.js';
import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

async function seed() {
  await connectDB();

  await Promise.all([
    Activity.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    Task.deleteMany({}),
    List.deleteMany({}),
    Board.deleteMany({}),
    Project.deleteMany({}),
    User.deleteMany({})
  ]);

  const [admin, designer, engineer] = await User.create([
    { name: 'Karan Admin', email: 'admin@example.com', password: 'password123' },
    { name: 'Mira Designer', email: 'mira@example.com', password: 'password123' },
    { name: 'Dev Engineer', email: 'dev@example.com', password: 'password123' }
  ]);

  await createProject({
    owner: admin,
    members: [
      { user: admin._id, role: 'owner' },
      { user: designer._id, role: 'admin' },
      { user: engineer._id, role: 'member' }
    ],
    name: 'Website Relaunch',
    description: 'Marketing site rebuild with design, content, and launch tasks.',
    tasks: [
      { title: 'Audit existing pages', list: 'To Do', assignees: [designer._id], priority: 'medium', labels: ['content'] },
      { title: 'Build pricing page', list: 'In Progress', assignees: [engineer._id], priority: 'high', labels: ['frontend'] },
      { title: 'Finalize launch checklist', list: 'Done', assignees: [admin._id], priority: 'low', labels: ['ops'] }
    ]
  });

  await createProject({
    owner: admin,
    members: [
      { user: admin._id, role: 'owner' },
      { user: engineer._id, role: 'member' }
    ],
    name: 'Mobile App Sprint',
    description: 'Two-week sprint for onboarding and notification polish.',
    tasks: [
      { title: 'Onboarding copy pass', list: 'To Do', assignees: [admin._id], priority: 'medium', labels: ['copy'] },
      { title: 'Push notification QA', list: 'In Progress', assignees: [engineer._id], priority: 'high', labels: ['qa'] }
    ]
  });

  console.log('Seed complete');
  console.log('Login: admin@example.com / password123');
  await mongoose.connection.close();
}

async function createProject({ owner, members, name, description, tasks }) {
  const project = await Project.create({ name, description, owner: owner._id, members });
  const board = await Board.create({ project: project._id, name: `${name} board` });
  const lists = await List.insertMany([
    { board: board._id, title: 'To Do', order: 0 },
    { board: board._id, title: 'In Progress', order: 1 },
    { board: board._id, title: 'Done', order: 2 }
  ]);

  board.lists = lists.map((list) => list._id);
  await board.save();

  for (const list of lists) {
    const taskSpecs = tasks.filter((task) => task.list === list.title);
    const createdTasks = await Task.insertMany(
      taskSpecs.map((task, index) => ({
        list: list._id,
        project: project._id,
        title: task.title,
        description: `${task.title} details and acceptance notes.`,
        assignees: task.assignees,
        priority: task.priority,
        labels: task.labels,
        order: index,
        dueDate: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000),
        createdBy: owner._id
      }))
    );

    list.tasks = createdTasks.map((task) => task._id);
    await list.save();
  }

  const firstTask = await Task.findOne({ project: project._id });
  if (firstTask) {
    await Comment.create({
      task: firstTask._id,
      user: owner._id,
      text: 'Kickoff notes are ready. Please add updates here.',
      mentions: []
    });
  }

  await Activity.create({ project: project._id, actor: owner._id, action: 'seeded project data' });
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
