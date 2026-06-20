import { requireAuth, setCors, safeUser } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;
  return res.status(200).json({ user: safeUser(user) });
}
