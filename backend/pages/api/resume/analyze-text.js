import { analyzeResumeText } from '../../../lib/ats-score';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  try {
    const { text, targetRole = 'Software Engineer' } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      res.status(400).json({ error: 'Please add more content to your resume before analyzing.' });
      return;
    }
    const analysis = analyzeResumeText({
      text: text.trim(),
      targetRole: String(targetRole || 'Software Engineer').trim() || 'Software Engineer',
    });
    res.status(200).json({ ...analysis });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unexpected error while analyzing the resume.',
    });
  }
}
