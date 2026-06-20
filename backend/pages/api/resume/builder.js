import { requireAuth, setCors } from '../../../lib/auth-middleware.js';
import Resume from '../../../lib/models/Resume.js';
import { connectDB } from '../../../lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const user = await requireAuth(req, res);
  if (!user) return;
  await connectDB();

  if (req.method === 'GET') {
    const resumes = await Resume.find({ user: user._id }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ resumes });
  }

  if (req.method === 'POST') {
    const { title, template, personal, summary, education, experience, skills, projects, certifications, achievements, languages } = req.body || {};
    const resume = await Resume.create({
      user: user._id, title: title || 'My Resume', template: template || 'modern',
      personal: personal || {}, summary: summary || '',
      education: education || [], experience: experience || [],
      skills: skills || [], projects: projects || [],
      certifications: certifications || [], achievements: achievements || [],
      languages: languages || [],
    });
    return res.status(201).json({ resume });
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body || {};
    const resume = await Resume.findOneAndUpdate({ _id: id, user: user._id }, updates, { new: true });
    if (!resume) return res.status(404).json({ error: 'Resume not found.' });
    return res.status(200).json({ resume });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await Resume.findOneAndDelete({ _id: id, user: user._id });
    return res.status(200).json({ message: 'Resume deleted.' });
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
