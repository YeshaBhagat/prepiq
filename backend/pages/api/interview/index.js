import { requireAuth, setCors } from '../../../lib/auth-middleware.js';
import AIInterview from '../../../lib/models/AIInterview.js';
import PracticeHistory from '../../../lib/models/PracticeHistory.js';
import Achievement from '../../../lib/models/Achievement.js';
import { connectDB } from '../../../lib/mongodb.js';
import { XP_REWARDS, calcLevel, checkAndAwardBadges } from '../../../lib/xp-system.js';
import { updateStreak } from '../../../lib/streak-helper.js';
import Streak from '../../../lib/models/Streak.js';

const INTERVIEW_QUESTIONS = {
  HR: [
    'Tell me about yourself.',
    'What are your greatest strengths?',
    'What is your biggest weakness?',
    'Why do you want to work here?',
    'Where do you see yourself in 5 years?',
    'Tell me about a challenge you overcame.',
    'How do you handle pressure and stress?',
    'Why are you leaving your current role?',
  ],
  Technical: [
    'Explain the difference between a stack and a queue.',
    'What is RESTful API design?',
    'Explain Object-Oriented Programming principles.',
    'What is the difference between SQL and NoSQL?',
    'How does HTTP work?',
    'Explain the concept of closures in JavaScript.',
    'What is time complexity and why does it matter?',
    'How would you optimize a slow database query?',
  ],
  Behavioral: [
    'Describe a time you worked in a team under pressure.',
    'Give an example of when you showed leadership.',
    'Tell me about a conflict with a team member and how you resolved it.',
    'Describe a time you failed and what you learned.',
    'Tell me about a project you are most proud of.',
    'Give an example of going above and beyond for a task.',
    'Describe how you prioritize tasks when everything is urgent.',
  ],
  Coding: [
    'Write a function to reverse a string.',
    'Find the two numbers in an array that sum to a target value.',
    'Check if a string is a palindrome.',
    'Write a function to find the factorial of a number.',
    'Implement a function to check if two strings are anagrams.',
    'Write code to find the largest element in an array.',
  ],
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;
  await connectDB();

  // GET — list user's interviews
  if (req.method === 'GET') {
    const interviews = await AIInterview.find({ user: user._id })
      .sort({ createdAt: -1 }).limit(20).lean();
    return res.status(200).json({ interviews });
  }

  // POST — start new interview
  if (req.method === 'POST') {
    const { type = 'HR', role } = req.body || {};
    const pool = INTERVIEW_QUESTIONS[type] || INTERVIEW_QUESTIONS.HR;
    // Pick 5 random questions
    const selected = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
    const interview = await AIInterview.create({
      user:      user._id,
      type,
      role:      role || user.targetRole || 'Software Engineer',
      status:    'in_progress',
      questions: selected.map(q => ({ question: q, userAnswer: '', aiFeedback: '', score: 0 })),
    });
    return res.status(201).json({ interview });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
