// POST /api/questions/seed — seeds the question bank (admin only or first run)
import { connectDB } from '../../../lib/mongodb.js';
import Question from '../../../lib/models/Question.js';
import { requireAdmin, setCors } from '../../../lib/auth-middleware.js';
import { SEED_QUESTIONS } from '../../../lib/seed-questions.js';

export default async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAdmin(req, res);
  if (!user) return;

  await connectDB();
  await Question.deleteMany({});
  await Question.insertMany(SEED_QUESTIONS);
  return res.status(200).json({ message: `Seeded ${SEED_QUESTIONS.length} questions.` });
}
