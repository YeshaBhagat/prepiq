import { connectDB } from '../../../lib/mongodb.js';
import Bookmark from '../../../lib/models/Bookmark.js';
import { requireAuth, setCors } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  await connectDB();
  const { questionId } = req.body || req.query;

  if (req.method === 'GET') {
    const bookmarks = await Bookmark.find({ user: user._id }).populate('question').lean();
    return res.status(200).json({ bookmarks });
  }

  if (req.method === 'POST') {
    const exists = await Bookmark.findOne({ user: user._id, question: questionId });
    if (exists) { await exists.deleteOne(); return res.status(200).json({ bookmarked: false }); }
    await Bookmark.create({ user: user._id, question: questionId });
    return res.status(201).json({ bookmarked: true });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
