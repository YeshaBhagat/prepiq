import { getTechnicalQuiz, scoreQuestionSet } from '../../../lib/practice-data.js';
import { requireAuth, setCors } from '../../../lib/auth-middleware.js';
import PracticeHistory from '../../../lib/models/PracticeHistory.js';
import Achievement from '../../../lib/models/Achievement.js';
import Streak from '../../../lib/models/Streak.js';
import { XP_REWARDS, calcLevel, checkAndAwardBadges } from '../../../lib/xp-system.js';
import { updateStreak } from '../../../lib/streak-helper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method === 'GET') {
    const topic = String(req.query.topic || 'DSA');
    return res.status(200).json(getTechnicalQuiz(topic));
  }

  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { topic = 'DSA', answers = {}, timeTaken = 0 } = req.body || {};
    const result = scoreQuestionSet('quiz', topic, answers);

    const xp = result.score * XP_REWARDS.quiz_correct;
    user.practiceCount += 1;
    user.score         += result.score;
    user.xp             = (user.xp || 0) + xp;
    user.level          = calcLevel(user.xp);
    user.lastActive     = new Date();
    await user.save();

    await PracticeHistory.create({
      user: user._id, category: topic, type: 'quiz',
      score: result.percentage, totalQ: result.total, correctQ: result.score,
      timeTaken: Number(timeTaken), xpEarned: xp,
    });

    await updateStreak(user, Streak);
    const newBadges = await checkAndAwardBadges(user, Achievement);

    return res.status(200).json({
      ...result, xpEarned: xp, newBadges,
      updatedStats: { practiceCount: user.practiceCount, streak: user.streak, score: user.score, xp: user.xp, level: user.level },
    });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
