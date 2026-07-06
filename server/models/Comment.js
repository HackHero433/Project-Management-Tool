import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
  },
  { timestamps: true }
);

export default mongoose.model('Comment', commentSchema);
