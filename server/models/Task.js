import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: Date,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    labels: [{ type: String, trim: true }],
    order: { type: Number, default: 0 },
    status: { type: String, default: 'open' },
    attachments: [String],
    reminderSent: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
