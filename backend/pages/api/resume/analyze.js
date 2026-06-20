import pdfParse from 'pdf-parse';
import { analyzeResumeText } from '../../../lib/ats-score';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sanitizeText(value) {
  return String(value || '')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
    const {
      fileDataBase64,
      fileName,
      fileType,
      targetRole = 'Software Engineer',
    } = req.body || {};

    const normalizedName = String(fileName || '').toLowerCase();
    const normalizedType = String(fileType || '').toLowerCase();
    const isPdf = normalizedName.endsWith('.pdf') || normalizedType === 'application/pdf' || normalizedType === 'application/x-pdf';

    if (!isPdf) {
      res.status(400).json({ error: 'Only PDF resumes are supported.' });
      return;
    }

    if (!fileDataBase64 || typeof fileDataBase64 !== 'string') {
      res.status(400).json({ error: 'Resume file data is required.' });
      return;
    }

    const buffer = Buffer.from(fileDataBase64, 'base64');

    if (buffer.length > 4 * 1024 * 1024) {
      res.status(400).json({ error: 'Resume file is too large. Please keep it under 4 MB.' });
      return;
    }

    const parsed = await pdfParse(buffer);
    const text = sanitizeText(parsed.text);

    if (text.length < 120) {
      res.status(400).json({
        error: 'Not enough readable text was found in the resume. Try a clearer PDF file.',
      });
      return;
    }

    const analysis = analyzeResumeText({
      text,
      targetRole: String(targetRole || 'Software Engineer').trim() || 'Software Engineer',
    });

    res.status(200).json({
      fileName: fileName || 'resume.pdf',
      ...analysis,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unexpected error while analyzing the resume.',
    });
  }
}



