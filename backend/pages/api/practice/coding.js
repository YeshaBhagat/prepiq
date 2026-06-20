import { getCodingChallenge, reviewCodingSolution } from '../../../lib/practice-data.js';
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
    return res.status(200).json(getCodingChallenge({ difficulty: req.query.difficulty, topic: req.query.topic }));
  }

  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { challengeId, code, timeTaken = 0 } = req.body || {};
    const result = reviewCodingSolution({ challengeId, code });

    if ((code || '').trim().length > 10) {
      const xp = XP_REWARDS.coding_submit;
      user.practiceCount += 1;
      user.score         += Math.floor(result.score / 10);
      user.xp             = (user.xp || 0) + xp;
      user.level          = calcLevel(user.xp);
      user.lastActive     = new Date();
      await user.save();

      await PracticeHistory.create({
        user: user._id, category: 'Coding', type: 'coding',
        score: result.score, totalQ: 1, correctQ: result.score >= 70 ? 1 : 0,
        timeTaken: Number(timeTaken), xpEarned: xp,
      });

      await updateStreak(user, Streak);
      const newBadges = await checkAndAwardBadges(user, Achievement);

      return res.status(200).json({
        ...result, xpEarned: xp, newBadges,
        updatedStats: { practiceCount: user.practiceCount, streak: user.streak, score: user.score, xp: user.xp, level: user.level },
      });
    }

    return res.status(200).json({ ...result, xpEarned: 0, newBadges: [] });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
