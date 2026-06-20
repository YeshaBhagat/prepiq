import { requireAdmin, setCors } from '../../../lib/auth-middleware.js';
import User from '../../../lib/models/User.js';
import { connectDB } from '../../../lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;
  await connectDB();

  if (req.method === 'GET') {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
    ];
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);
    return res.status(200).json({ users, total, pages: Math.ceil(total/limit) });
  }

  if (req.method === 'PUT') {
    const { id, isActive, isAdmin } = req.body || {};
    const user = await User.findByIdAndUpdate(id, { isActive, isAdmin }, { new: true }).select('-password');
    return res.status(200).json({ user });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'User id required.' });
    if (id === admin._id.toString()) return res.status(400).json({ error: 'You cannot delete your own account.' });
    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: 'User deleted.' });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}

