import { requireAuth, setCors } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAuth(req, res).catch(() => null);
  if (user) { user.lastActive = new Date(); await user.save().catch(() => {}); }
  return res.status(200).json({ message: 'Logged out successfully.' });
}
