import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../lib/mongodb.js';
import User from '../../../lib/models/User.js';
import { setCors, safeUser } from '../../../lib/auth-middleware.js';
import { updateStreak } from '../../../lib/streak-helper.js';
import Streak from '../../../lib/models/Streak.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prepiq-dev-secret-change-in-production';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  try {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) { await bcrypt.hash('dummy', 12); return res.status(401).json({ error: 'No account found with this email.' }); }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

    // Update streak on login
    await updateStreak(user, Streak);
    user.lastActive = new Date();
    user.xp = (user.xp || 0) + 5; // daily login XP
    await user.save();

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
