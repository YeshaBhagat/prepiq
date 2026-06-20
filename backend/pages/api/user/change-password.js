import bcrypt from 'bcryptjs';
import { requireAuth, setCors } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields are required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return res.status(200).json({ message: 'Password changed successfully.' });
}
