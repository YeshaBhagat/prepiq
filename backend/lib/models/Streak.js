import mongoose from 'mongoose';

const StreakSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastDate:      { type: String },   // YYYY-MM-DD
  history:       [{ type: String }], // array of YYYY-MM-DD strings
  milestones:    [{ days: Number, achievedAt: Date }],
}, { timestamps: true });

export default mongoose.models.Streak || mongoose.model('Streak', StreakSchema);
