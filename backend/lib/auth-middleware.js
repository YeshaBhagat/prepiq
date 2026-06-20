import jwt from 'jsonwebtoken';
import { connectDB } from './mongodb.js';
import User from './models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prepiq-dev-secret-change-in-production';

export async function requireAuth(req, res) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or deactivated.' });
      return null;
    }
    return user;
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired.' : 'Invalid token.';
    res.status(401).json({ error: msg });
    return null;
  }
}

export async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (!user.isAdmin) {
    res.status(403).json({ error: 'Admin access required.' });
    return null;
  }
  return user;
}

export function setCors(res, methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function safeUser(user) {
  return {
    id:            user._id.toString(),
    firstName:     user.firstName,
    lastName:      user.lastName,
    email:         user.email,
    avatar:        user.avatar || '',
    bio:           user.bio || '',
    college:       user.college || '',
    skills:        user.skills || [],
    targetRole:    user.targetRole || 'Software Engineer',
    isAdmin:       user.isAdmin || false,
    practiceCount: user.practiceCount,
    streak:        user.streak,
    longestStreak: user.longestStreak,
    score:         user.score,
    xp:            user.xp,
    level:         user.level,
    joinedDate:    user.createdAt?.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }),
  };
}

