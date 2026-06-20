import { requireAuth, setCors } from '../../../lib/auth-middleware.js';
import PracticeHistory from '../../../lib/models/PracticeHistory.js';
import AIInterview from '../../../lib/models/AIInterview.js';
import Achievement from '../../../lib/models/Achievement.js';
import Streak from '../../../lib/models/Streak.js';
import Resume from '../../../lib/models/Resume.js';

export default async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  const uid = user._id;

  // Parallel fetch everything
  const [
    recentActivity,
    interviewStats,
    achievements,
    streakDoc,
    latestResume,
    weeklyHistory,
    topicAccuracy,
  ] = await Promise.all([
    PracticeHistory.find({ user: uid }).sort({ createdAt: -1 }).limit(10).lean(),
    AIInterview.find({ user: uid, status: 'completed' }).lean(),
    Achievement.find({ user: uid }).sort({ earnedAt: -1 }).lean(),
    Streak.findOne({ user: uid }).lean(),
    Resume.findOne({ user: uid }).sort({ updatedAt: -1 }).lean(),
    // Last 7 days of practice
    PracticeHistory.find({
      user: uid,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600000) }
    }).lean(),
    // Topic-wise accuracy
    PracticeHistory.aggregate([
      { $match: { user: uid, totalQ: { $gt: 0 } } },
      { $group: { _id: '$category', totalQ: { $sum: '$totalQ' }, correctQ: { $sum: '$correctQ' } } },
    ]),
  ]);

  const avgScore = interviewStats.length
    ? Math.round(interviewStats.reduce((s, i) => s + (i.overallScore || 0), 0) / interviewStats.length)
    : 0;

  // Weekly progress — sessions per day
  const weekMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    weekMap[d.toISOString().slice(0,10)] = 0;
  }
  weeklyHistory.forEach(h => {
    const key = h.createdAt.toISOString?.().slice(0,10) || String(h.createdAt).slice(0,10);
    if (weekMap[key] !== undefined) weekMap[key]++;
  });

  const topicStats = topicAccuracy.map(t => ({
    category: t._id,
    accuracy: Math.round((t.correctQ / t.totalQ) * 100),
    total: t.totalQ,
  })).sort((a, b) => b.accuracy - a.accuracy);

  return res.status(200).json({
    stats: {
      practiceCount:     user.practiceCount,
      streak:            user.streak,
      longestStreak:     user.longestStreak,
      score:             user.score,
      xp:                user.xp,
      level:             user.level,
      interviewsDone:    interviewStats.length,
      avgInterviewScore: avgScore,
      atsScore:          latestResume?.atsScore || 0,
      achievementCount:  achievements.length,
    },
    recentActivity: recentActivity.map(h => ({
      id:       h._id,
      type:     h.type,
      category: h.category,
      score:    h.score,
      totalQ:   h.totalQ,
      xpEarned: h.xpEarned,
      date:     h.createdAt,
    })),
    weeklyProgress: Object.entries(weekMap).map(([date, count]) => ({ date, count })),
    topicAccuracy:  topicStats,
    achievements:   achievements.slice(0, 6),
    streakHistory:  streakDoc?.history?.slice(-30) || [],
  });
}
