import { connectDB } from '../../../lib/mongodb.js';
import Question from '../../../lib/models/Question.js';
import Bookmark from '../../../lib/models/Bookmark.js';
import { requireAuth, setCors } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  await connectDB();

  if (req.method === 'GET') {
    const { category, difficulty, search, company, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category)   filter.category   = category;
    if (difficulty) filter.difficulty = difficulty;
    if (company)    filter.companies  = { $in: [company] };
    if (search)     filter.$text      = { $search: search };

    const skip  = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
      Question.countDocuments(filter),
    ]);

    // Add bookmark info if authenticated
    let bookmarkedIds = new Set();
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const { requireAuth: ra } = await import('../../../lib/auth-middleware.js');
        const user = await ra(req, { status: () => ({ json: () => {} }), setHeader: () => {} });
        if (user) {
          const bookmarks = await Bookmark.find({ user: user._id }).select('question').lean();
          bookmarkedIds = new Set(bookmarks.map(b => b.question.toString()));
        }
      } catch {}
    }

    return res.status(200).json({
      questions: questions.map(q => ({ ...q, bookmarked: bookmarkedIds.has(q._id.toString()) })),
      total, page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
