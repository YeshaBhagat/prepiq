import { requireAuth, setCors } from '../../../lib/auth-middleware.js';
import PracticeHistory from '../../../lib/models/PracticeHistory.js';
import AIInterview from '../../../lib/models/AIInterview.js';
import Achievement from '../../../lib/models/Achievement.js';
import { connectDB } from '../../../lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;
  await connectDB();

  let uid = user._id;
  if (req.query.userId && user.isAdmin) {
    const mongoose = (await import('mongoose')).default;
    if (mongoose.Types.ObjectId.isValid(req.query.userId)) {
      uid = new mongoose.Types.ObjectId(req.query.userId);
    }
  }
  const period = req.query.period || '30'; // days

  const since = new Date(Date.now() - Number(period) * 24 * 3600000);

  const [history, topicAgg, dailyAgg, interviews] = await Promise.all([
    PracticeHistory.find({ user: uid, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean(),
    PracticeHistory.aggregate([
      { $match: { user: uid, totalQ: { $gt: 0 } } },
      { $group: { _id: '$category', totalQ: { $sum: '$totalQ' }, correctQ: { $sum: '$correctQ' }, sessions: { $sum: 1 }, avgScore: { $avg: '$score' } } },
    ]),
    PracticeHistory.aggregate([
      { $match: { user: uid, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sessions: { $sum: 1 }, score: { $avg: '$score' } } },
      { $sort: { _id: 1 } },
    ]),
    AIInterview.find({ user: uid, status: 'completed' }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const topicStats = topicAgg.map(t => ({
    category:  t._id,
    accuracy:  t.totalQ ? Math.round((t.correctQ / t.totalQ) * 100) : 0,
    sessions:  t.sessions,
    avgScore:  Math.round(t.avgScore || 0),
    totalQ:    t.totalQ,
  })).sort((a, b) => b.accuracy - a.accuracy);

  const strongTopics = topicStats.filter(t => t.accuracy >= 70).slice(0, 3);
  const weakTopics   = topicStats.filter(t => t.accuracy < 60).slice(0, 3);

  const totalTime = history.reduce((s, h) => s + (h.timeTaken || 0), 0);

  return res.status(200).json({
    summary: {
      totalSessions:     history.length,
      totalQuestions:    history.reduce((s, h) => s + (h.totalQ || 0), 0),
      avgScore:          history.length ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length) : 0,
      studyHours:        Math.round(totalTime / 3600 * 10) / 10,
      interviewsDone:    interviews.length,
      avgInterviewScore: interviews.length ? Math.round(interviews.reduce((s, i) => s + i.overallScore, 0) / interviews.length) : 0,
    },
    dailyProgress:  dailyAgg.map(d => ({ date: d._id, sessions: d.sessions, score: Math.round(d.score || 0) })),
    topicAccuracy:  topicStats,
    strongTopics,
    weakTopics,
    interviewHistory: interviews.map(i => ({ type: i.type, score: i.overallScore, date: i.createdAt })),
    recentSessions: history.slice(0, 15),
  });
}
