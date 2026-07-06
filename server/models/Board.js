import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, default: 'Main board', trim: true },
    lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }]
  },
  { timestamps: true }
);

export default mongoose.model('Board', boardSchema);
