import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../lib/mongodb.js';
import User from '../../../lib/models/User.js';
import Streak from '../../../lib/models/Streak.js';
import { setCors, safeUser } from '../../../lib/auth-middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prepiq-dev-secret-change-in-production';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed.' }); return; }

  const { firstName, lastName, email, password, targetRole, college } = req.body || {};

  if (!firstName || !lastName || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    await connectDB();
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName: firstName.trim(), lastName: lastName.trim(),
      email: email.toLowerCase().trim(), password: hash,
      targetRole: targetRole || 'Software Engineer',
      college: college || '',
    });

    // Create streak doc
    await Streak.create({ user: user._id });

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}
