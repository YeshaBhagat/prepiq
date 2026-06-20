import { requireAuth, setCors } from '../../../lib/auth-middleware.js';
import Streak from '../../../lib/models/Streak.js';
import { connectDB } from '../../../lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;
  await connectDB();

  const streak = await Streak.findOne({ user: user._id }).lean();
  return res.status(200).json({
    currentStreak:  streak?.currentStreak || 0,
    longestStreak:  streak?.longestStreak || 0,
    lastDate:       streak?.lastDate || null,
    history:        streak?.history || [],
    milestones:     streak?.milestones || [],
  });
}
