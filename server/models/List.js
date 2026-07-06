import mongoose from 'mongoose';

const listSchema = new mongoose.Schema(
  {
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
  },
  { timestamps: true }
);

export default mongoose.model('List', listSchema);
