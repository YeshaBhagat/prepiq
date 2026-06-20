import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badge:       { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String },
  xp:          { type: Number, default: 0 },
  icon:        { type: String },
  earnedAt:    { type: Date, default: Date.now },
}, { timestamps: true });

AchievementSchema.index({ user: 1 });

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
