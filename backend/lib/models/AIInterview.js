import mongoose from 'mongoose';

const QASchema = new mongoose.Schema({
  question:    { type: String },
  userAnswer:  { type: String },
  aiFeedback:  { type: String },
  score:       { type: Number },
  strengths:   [{ type: String }],
  weaknesses:  [{ type: String }],
}, { _id: false });

const AIInterviewSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:         { type: String, enum: ['HR','Technical','Behavioral','Resume','Coding'], required: true },
  role:         { type: String, default: 'Software Engineer' },
  status:       { type: String, enum: ['in_progress','completed'], default: 'in_progress' },
  questions:    [QASchema],
  overallScore: { type: Number, default: 0 },
  summary:      { type: String },
  strengths:    [{ type: String }],
  improvements: [{ type: String }],
  xpEarned:     { type: Number, default: 0 },
}, { timestamps: true });

AIInterviewSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.AIInterview || mongoose.model('AIInterview', AIInterviewSchema);
