import bcrypt from 'bcryptjs';
import { connectDB } from '../../../lib/mongodb.js';
import User from '../../../lib/models/User.js';
import { setCors } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required.' });
  if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    await connectDB();
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });

    user.password         = await bcrypt.hash(password, 12);
    user.resetToken       = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('[reset-password]', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}
