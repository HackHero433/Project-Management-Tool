import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['assigned', 'comment', 'mention', 'due-soon', 'invited'],
      required: true
    },
    message: { type: String, required: true },
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
