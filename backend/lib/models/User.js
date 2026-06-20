import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName:     { type: String, required: true, trim: true },
  lastName:      { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: false },
  oauthProvider: { type: String, default: '' },
  avatar:        { type: String, default: '' },
  bio:           { type: String, default: '', maxlength: 300 },
  college:       { type: String, default: '' },
  skills:        [{ type: String }],
  targetRole:    { type: String, default: 'Software Engineer' },
  resumeUrl:     { type: String, default: '' },
  isAdmin:       { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  // stats
  practiceCount: { type: Number, default: 0 },
  streak:        { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  score:         { type: Number, default: 0 },
  xp:            { type: Number, default: 0 },
  level:         { type: Number, default: 1 },
  // password reset
  resetToken:        { type: String },
  resetTokenExpiry:  { type: Date },
  lastActive:    { type: Date, default: Date.now },
  lastStreakDate:{ type: Date },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);

