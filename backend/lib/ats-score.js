/* ====================================================
   lib/ats-score.js
   ATS (Applicant Tracking System) resume scoring engine.
   Called by pages/api/resume/analyze.js
   ==================================================== */

/**
 * Keywords indexed by target role.
 * Extend this map with more roles as needed.
 */
const ROLE_KEYWORDS = {
  'Software Engineer': [
    'algorithms', 'data structures', 'object-oriented', 'REST', 'API', 'git', 'agile',
    'testing', 'debugging', 'microservices', 'CI/CD', 'docker', 'kubernetes', 'sql',
    'problem solving', 'code review', 'system design', 'backend', 'scalability',
  ],
  'Frontend Developer': [
    'HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', 'TypeScript', 'responsive',
    'accessibility', 'webpack', 'performance', 'UI', 'UX', 'REST', 'API', 'git', 'agile',
    'cross-browser', 'mobile-first', 'figma', 'storybook',
  ],
  'Backend Developer': [
    'Node.js', 'Python', 'Java', 'Go', 'REST', 'GraphQL', 'SQL', 'NoSQL', 'Redis',
    'microservices', 'docker', 'kubernetes', 'CI/CD', 'API', 'git', 'authentication',
    'authorization', 'caching', 'scalability', 'system design', 'message queue',
  ],
  'Full Stack Developer': [
    'React', 'Node.js', 'SQL', 'NoSQL', 'REST', 'API', 'git', 'HTML', 'CSS',
    'JavaScript', 'TypeScript', 'docker', 'CI/CD', 'agile', 'testing', 'authentication',
    'deployment', 'cloud', 'responsive', 'performance',
  ],
  'Data Scientist': [
    'Python', 'R', 'machine learning', 'deep learning', 'statistics', 'pandas', 'NumPy',
    'scikit-learn', 'TensorFlow', 'PyTorch', 'SQL', 'data visualization', 'matplotlib',
    'feature engineering', 'model evaluation', 'A/B testing', 'NLP', 'regression',
    'classification', 'clustering',
  ],
  'Product Manager': [
    'roadmap', 'stakeholder', 'agile', 'scrum', 'user stories', 'KPIs', 'metrics',
    'product strategy', 'market research', 'competitive analysis', 'PRD', 'go-to-market',
    'prioritization', 'OKRs', 'user research', 'wireframe', 'cross-functional', 'backlog',
  ],
  'DevOps Engineer': [
    'CI/CD', 'docker', 'kubernetes', 'terraform', 'ansible', 'Jenkins', 'git', 'Linux',
    'bash', 'monitoring', 'logging', 'AWS', 'GCP', 'Azure', 'infrastructure', 'pipelines',
    'deployment', 'security', 'automation', 'SRE',
  ],
  'ML Engineer': [
    'machine learning', 'deep learning', 'Python', 'TensorFlow', 'PyTorch', 'model deployment',
    'MLOps', 'feature engineering', 'data pipelines', 'Docker', 'kubernetes', 'cloud',
    'A/B testing', 'model monitoring', 'distributed training', 'GPU', 'scikit-learn',
  ],
};

/** Fallback keywords used when the target role is not in the map */
const DEFAULT_KEYWORDS = [
  'experience', 'skills', 'projects', 'education', 'achievements',
  'communication', 'teamwork', 'problem solving', 'leadership',
];

/** Expected resume sections */
const SECTIONS = ['education', 'experience', 'skills', 'projects', 'summary', 'contact'];

/**
 * Scores a single section (0–max).
 * @param {string} text - Full resume text (lowercase)
 * @param {string} section - Section name
 * @param {number} max - Max score for this section
 */
function scoreSection(text, section, max) {
  const found = text.includes(section);
  return found ? max : 0;
}

/**
 * Main scoring function.
 * @param {{ text: string, targetRole: string }} options
 * @returns {object} Analysis result
 */
export function analyzeResumeText({ text, targetRole }) {
  const lower = text.toLowerCase();

  // ── 1. Keyword matching ──────────────────────────────────────────────────
  const keywords  = ROLE_KEYWORDS[targetRole] || DEFAULT_KEYWORDS;
  const matched   = keywords.filter(kw => lower.includes(kw.toLowerCase()));
  const missing   = keywords.filter(kw => !lower.includes(kw.toLowerCase()));
  const kwScore   = Math.round((matched.length / keywords.length) * 35); // max 35

  // ── 2. Section coverage ──────────────────────────────────────────────────
  let sectionScore = 0;
  const sectionMax = Math.floor(30 / SECTIONS.length); // ~5 pts each
  SECTIONS.forEach(sec => { sectionScore += scoreSection(lower, sec, sectionMax); });
  sectionScore = Math.min(30, sectionScore); // cap at 30

  // ── 3. Contact info ──────────────────────────────────────────────────────
  const hasEmail  = /@[a-z0-9.-]+\.[a-z]{2,}/.test(lower);
  const hasPhone  = /(\+?\d[\d\s\-().]{8,}\d)/.test(text);
  const hasLinked = lower.includes('linkedin');
  const hasGithub = lower.includes('github');
  const contactScore = [hasEmail, hasPhone, hasLinked, hasGithub]
    .filter(Boolean).length * 2.5; // max 10

  // ── 4. Formatting signals ────────────────────────────────────────────────
  const wordCount     = text.split(/\s+/).filter(Boolean).length;
  const goodLength    = wordCount >= 200 && wordCount <= 900;
  const hasBullets    = (text.match(/[•\-*]\s/g) || []).length >= 3;
  const hasNumbers    = /\d+%|\d+ years?|\$\d+|\d+\+/.test(text);
  const formatScore   = [goodLength, hasBullets, hasNumbers].filter(Boolean).length * (25 / 3);

  // ── 5. Aggregate ─────────────────────────────────────────────────────────
  const raw      = kwScore + sectionScore + contactScore + Math.round(formatScore);
  const atsScore = Math.min(100, Math.max(0, raw));

  // ── 6. Rating ────────────────────────────────────────────────────────────
  let rating = 'Needs Work';
  if (atsScore >= 80) rating = 'Excellent';
  else if (atsScore >= 65) rating = 'Good';
  else if (atsScore >= 45) rating = 'Fair';

  // ── 7. Strengths & improvements ──────────────────────────────────────────
  const strengths    = [];
  const improvements = [];

  if (matched.length >= 8)  strengths.push(`Strong keyword coverage — ${matched.length} role-specific keywords found.`);
  if (hasNumbers)           strengths.push('Uses quantified achievements (numbers, percentages, metrics).');
  if (hasBullets)           strengths.push('Well-structured with bullet points for easy ATS parsing.');
  if (hasLinked && hasGithub) strengths.push('Includes both LinkedIn and GitHub profile links.');
  if (sectionScore >= 20)   strengths.push('All major resume sections are clearly present.');

  if (missing.length > 5)     improvements.push(`Add missing keywords: ${missing.slice(0, 5).join(', ')}.`);
  if (!hasNumbers)            improvements.push('Quantify achievements with numbers, percentages, or impact metrics.');
  if (!goodLength)            improvements.push(wordCount < 200 ? 'Resume appears too short — expand on projects and experience.' : 'Resume may be too long — keep it concise (ideally 400–700 words).');
  if (!hasLinked)             improvements.push('Add your LinkedIn profile URL to improve recruiter reachability.');
  if (!hasGithub)             improvements.push('Include a GitHub link to showcase your project portfolio.');

  // ── 8. Section breakdown ─────────────────────────────────────────────────
  const breakdown = [
    { label: 'Keyword Match',      score: kwScore,                   max: 35 },
    { label: 'Section Coverage',   score: sectionScore,              max: 30 },
    { label: 'Contact Information',score: Math.round(contactScore),  max: 10 },
    { label: 'Formatting Signals', score: Math.round(formatScore),   max: 25 },
  ];

  // ── 9. Summary ────────────────────────────────────────────────────────────
  const summaryMap = {
    Excellent: 'Your resume is highly optimized for ATS systems targeting this role.',
    Good:      'Your resume performs well — a few targeted tweaks will push it higher.',
    Fair:      'Your resume is on the right track but has notable gaps to address.',
    'Needs Work': 'Your resume needs significant improvements to pass ATS filters reliably.',
  };

  return {
    atsScore:        `${atsScore}/100`,
    rating,
    targetRole,
    summary:         summaryMap[rating],
    matchedKeywords: matched,
    missingKeywords: missing.slice(0, 10),
    strengths:       strengths.length ? strengths : ['Resume was processed — continue refining content.'],
    improvements:    improvements.length ? improvements : ['Resume looks solid. Keep tailoring for each role.'],
    breakdown,
  };
}
