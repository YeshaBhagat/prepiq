import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, default: 'My Resume' },
  template:   { type: String, default: 'modern' },
  personal:   {
    fullName: String, email: String, phone: String,
    location: String, linkedin: String, github: String, website: String,
  },
  summary:    { type: String },
  education:  [{ institution: String, degree: String, field: String, year: String, gpa: String }],
  experience: [{ company: String, role: String, duration: String, description: String }],
  skills:     [{ type: String }],
  projects:   [{ name: String, tech: String, description: String, link: String }],
  certifications: [{ name: String, issuer: String, year: String }],
  achievements:   [{ type: String }],
  languages:      [{ language: String, proficiency: String }],
  atsScore:   { type: Number, default: 0 },
  isDraft:    { type: Boolean, default: true },
}, { timestamps: true });

ResumeSchema.index({ user: 1 });

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
