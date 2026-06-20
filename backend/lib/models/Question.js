import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, required: true, enum: [
    'DSA','DBMS','OS','CN','OOP','Java','Python','JavaScript',
    'React','NodeJS','SQL','HR','SystemDesign','Aptitude','Behavioral'
  ]},
  difficulty:  { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  companies:   [{ type: String }],
  tags:        [{ type: String }],
  options:     [{ type: String }],       // MCQ options
  answer:      { type: Number },         // index of correct option
  explanation: { type: String },
  type:        { type: String, enum: ['mcq','subjective','coding'], default: 'mcq' },
  isActive:    { type: Boolean, default: true },
  solvedCount: { type: Number, default: 0 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

QuestionSchema.index({ category: 1, difficulty: 1 });
QuestionSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
