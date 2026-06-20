import mongoose from 'mongoose';

const PracticeHistorySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category:    { type: String, required: true },
  type:        { type: String, enum: ['quiz','aptitude','coding','interview','resume'], required: true },
  score:       { type: Number, default: 0 },
  totalQ:      { type: Number, default: 0 },
  correctQ:    { type: Number, default: 0 },
  timeTaken:   { type: Number, default: 0 }, // seconds
  xpEarned:    { type: Number, default: 0 },
  details:     { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

PracticeHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.PracticeHistory || mongoose.model('PracticeHistory', PracticeHistorySchema);
