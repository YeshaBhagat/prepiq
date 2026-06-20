import bcrypt from 'bcryptjs';
import { requireAuth, setCors } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res, 'DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'DELETE') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password confirmation required.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Incorrect password.' });

  user.isActive = false;
  user.email    = `deleted_${Date.now()}_${user.email}`;
  await user.save();

  return res.status(200).json({ message: 'Account deleted successfully.' });
}
