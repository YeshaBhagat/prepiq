import { requireAuth, setCors, safeUser } from '../../../lib/auth-middleware.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  // GET — return profile
  if (req.method === 'GET') {
    return res.status(200).json({ user: safeUser(user) });
  }

  // PUT — update profile
  if (req.method === 'PUT') {
    const { firstName, lastName, bio, college, skills, targetRole, avatar } = req.body || {};
    if (firstName) user.firstName  = firstName.trim();
    if (lastName)  user.lastName   = lastName.trim();
    if (bio !== undefined)        user.bio        = String(bio).slice(0, 300);
    if (college !== undefined)    user.college    = college;
    if (skills && Array.isArray(skills)) user.skills = skills.slice(0, 20);
    if (targetRole) user.targetRole = targetRole;
    if (avatar)    user.avatar     = avatar;
    await user.save();
    return res.status(200).json({ user: safeUser(user), message: 'Profile updated.' });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
