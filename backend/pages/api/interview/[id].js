import { requireAuth, setCors } from '../../../lib/auth-middleware.js';
import AIInterview from '../../../lib/models/AIInterview.js';
import PracticeHistory from '../../../lib/models/PracticeHistory.js';
import Achievement from '../../../lib/models/Achievement.js';
import Streak from '../../../lib/models/Streak.js';
import { connectDB } from '../../../lib/mongodb.js';
import { XP_REWARDS, calcLevel, checkAndAwardBadges } from '../../../lib/xp-system.js';
import { updateStreak } from '../../../lib/streak-helper.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function evaluateAnswer(question, answer, type) {
  if (!ANTHROPIC_API_KEY || !answer?.trim()) {
    // Fallback scoring without AI
    const wordCount = (answer || '').split(' ').filter(Boolean).length;
    const score = Math.min(10, Math.max(1, Math.floor(wordCount / 5)));
    return {
      score,
      feedback: wordCount < 10
        ? 'Answer is too brief. Elaborate with specific examples.'
        : 'Good attempt. Add more structure and specific examples to strengthen your answer.',
      strengths:    wordCount > 30 ? ['Detailed response', 'Good length'] : ['Made an attempt'],
      weaknesses:   wordCount < 20 ? ['Too brief', 'Needs more examples'] : ['Could add more structure'],
    };
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `You are a senior interviewer evaluating a ${type} interview answer.

Question: "${question}"
Candidate's Answer: "${answer}"

Evaluate and respond ONLY with valid JSON (no markdown):
{
  "score": <1-10>,
  "feedback": "<2-3 sentence constructive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<improvement 1>", "<improvement 2>"]
}`,
        }],
      }),
    });
    const data = await resp.json();
    const text = data.content?.[0]?.text || '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { score: 5, feedback: 'Answer evaluated. Continue to improve with specific examples.', strengths: ['Attempted'], weaknesses: ['Be more specific'] };
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;
  await connectDB();

  const { id } = req.query;
  const interview = await AIInterview.findOne({ _id: id, user: user._id });
  if (!interview) return res.status(404).json({ error: 'Interview not found.' });

  // GET — fetch interview
  if (req.method === 'GET') return res.status(200).json({ interview });

  // PUT — submit an answer
  if (req.method === 'PUT') {
    const { questionIndex, answer } = req.body || {};
    if (questionIndex === undefined || !answer)
      return res.status(400).json({ error: 'questionIndex and answer are required.' });

    const q = interview.questions[questionIndex];
    if (!q) return res.status(404).json({ error: 'Question not found.' });

    const evaluation = await evaluateAnswer(q.question, answer, interview.type);
    interview.questions[questionIndex].userAnswer = answer;
    interview.questions[questionIndex].aiFeedback = evaluation.feedback;
    interview.questions[questionIndex].score      = evaluation.score;
    interview.questions[questionIndex].strengths  = evaluation.strengths || [];
    interview.questions[questionIndex].weaknesses = evaluation.weaknesses || [];
    interview.markModified('questions');
    await interview.save();
    return res.status(200).json({ evaluation, interview });
  }

  // PATCH — complete interview
  if (req.method === 'PATCH') {
    const answered = interview.questions.filter(q => q.userAnswer);
    if (answered.length === 0) return res.status(400).json({ error: 'Answer at least one question.' });

    const totalScore = answered.reduce((s, q) => s + (q.score || 0), 0);
    const avg = Math.round((totalScore / answered.length) * 10);

    // Collect all strengths/weaknesses
    const allStrengths    = answered.flatMap(q => q.strengths  || []);
    const allWeaknesses   = answered.flatMap(q => q.weaknesses || []);
    const uniqueStrengths = [...new Set(allStrengths)].slice(0, 4);
    const uniqueWeakness  = [...new Set(allWeaknesses)].slice(0, 4);

    interview.status       = 'completed';
    interview.overallScore = avg;
    interview.strengths    = uniqueStrengths;
    interview.improvements = uniqueWeakness;
    interview.summary      = `Completed ${interview.type} interview with ${answered.length} questions. Overall score: ${avg}/100.`;
    interview.xpEarned     = XP_REWARDS.interview_complete;
    await interview.save();

    // Update user stats
    user.practiceCount += 1;
    user.score         += avg;
    user.xp            = (user.xp || 0) + XP_REWARDS.interview_complete;
    user.level          = calcLevel(user.xp);
    await user.save();

    // Save history
    await PracticeHistory.create({
      user: user._id, category: interview.type, type: 'interview',
      score: avg, totalQ: answered.length, correctQ: answered.length,
      xpEarned: XP_REWARDS.interview_complete,
    });

    // Update streak & check badges
    await updateStreak(user, Streak);
    const newBadges = await checkAndAwardBadges(user, Achievement);

    return res.status(200).json({ interview, newBadges });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
