/* ====================================================
   achievements.js — Achievements & Badges page
   ==================================================== */

const ALL_BADGES = [
  { badge:'first_practice',  title:'First Step',       description:'Complete your first practice session', icon:'🎯', xp:20 },
  { badge:'streak_3',        title:'On Fire',           description:'3-day practice streak',                icon:'🔥', xp:30 },
  { badge:'streak_7',        title:'Week Warrior',      description:'7-day practice streak',                icon:'⚡', xp:50 },
  { badge:'streak_30',       title:'Unstoppable',       description:'30-day practice streak',               icon:'🏆', xp:200 },
  { badge:'score_100',       title:'Centurion',         description:'Score 100+ total points',              icon:'💯', xp:25 },
  { badge:'interview_first', title:'Interviewed',       description:'Complete your first AI interview',     icon:'🤖', xp:40 },
  { badge:'resume_analyzed', title:'Resume Ready',      description:'Analyze your resume',                  icon:'📄', xp:20 },
  { badge:'questions_10',    title:'Problem Solver',    description:'Solve 10 questions',                   icon:'🧩', xp:30 },
  { badge:'questions_50',    title:'Practice Pro',      description:'Solve 50 questions',                   icon:'⭐', xp:100 },
  { badge:'level_5',         title:'Level 5 Reached',   description:'Reach Level 5',                        icon:'🚀', xp:75 },
];

async function loadAchievements() {
  const user = getSession();
  try {
    const res  = await authFetch(`${API}/api/analytics?period=365`);
    const data = await res.json();

    document.getElementById('achSummary').innerHTML = `
      <div class="stats-grid" style="margin-bottom:24px">
        <div class="stat-tile"><div class="stat-tile-num">${user.xp || 0}</div><div class="stat-tile-label">Total XP</div></div>
        <div class="stat-tile"><div class="stat-tile-num accent2">Lv ${user.level || 1}</div><div class="stat-tile-label">Current Level</div></div>
        <div class="stat-tile"><div class="stat-tile-num green">${user.streak || 0}🔥</div><div class="stat-tile-label">Current Streak</div></div>
        <div class="stat-tile"><div class="stat-tile-num gold">${user.longestStreak || 0}</div><div class="stat-tile-label">Longest Streak</div></div>
      </div>`;
  } catch {}

  try {
    const dashRes  = await authFetch(`${API}/api/dashboard`);
    const dashData = await dashRes.json();
    const earned   = dashData.achievements || [];
    const earnedSet = new Set(earned.map(a => a.badge));

    const earnedEl = document.getElementById('earnedBadges');
    if (earned.length) {
      earnedEl.innerHTML = earned.map((a, i) => `
        <div class="badge-card earned">
          <div class="badge-big-icon">${a.icon || '🏅'}</div>
          <div class="badge-big-title">${escHtml(a.title)}</div>
          <div class="badge-big-desc">${escHtml(a.description || '')}</div>
          <div class="badge-big-xp">+${a.xp || 0} XP</div>
          <div class="badge-big-date">${fmtDate(a.earnedAt)}</div>
          <button class="badge-share-btn" type="button" data-idx="${i}">Share</button>
        </div>`).join('');

      earnedEl.querySelectorAll('.badge-share-btn').forEach(btn => {
        btn.addEventListener('click', () => shareBadge(earned[Number(btn.dataset.idx)]));
      });
    } else {
      earnedEl.innerHTML = '<div class="empty-state">No badges yet. Start practicing to earn them!</div>';
    }

    document.getElementById('allBadges').innerHTML = ALL_BADGES.map(b => {
      const isEarned = earnedSet.has(b.badge);
      return `
        <div class="badge-card ${isEarned ? 'earned' : 'locked'}">
          <div class="badge-big-icon" style="${isEarned ? '' : 'filter:grayscale(1);opacity:.4'}">${b.icon}</div>
          <div class="badge-big-title">${escHtml(b.title)}</div>
          <div class="badge-big-desc">${escHtml(b.description)}</div>
          <div class="badge-big-xp">+${b.xp} XP</div>
          ${isEarned ? '<div class="badge-earned-tag">✅ Earned</div>' : '<div class="badge-locked-tag">🔒 Locked</div>'}
        </div>`;
    }).join('');

  } catch (err) {
    showToast('Failed to load achievements.', 'error');
  }
}

/* ---------- SHARE BADGE ---------- */
function shareBadge(badge) {
  const text = `${badge.icon || '🏅'} Just unlocked the "${badge.title}" badge on PrepIQ!\n\n${badge.description || ''}\n\nPreparing smarter, one milestone at a time. 🚀\n\n#PrepIQ #InterviewPrep #CareerGrowth #LearningJourney`;
  const url = window.location.origin + '/index.html';
  showShareMenu(badge, text, url);
}

function showShareMenu(badge, text, url) {
  const existing = document.getElementById('shareMenuOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'shareMenuOverlay';
  overlay.className = 'admin-modal';
  overlay.innerHTML = `
    <div class="admin-modal-content share-modal-content">
      <button class="admin-modal-close" id="closeShareMenu">&times;</button>

      <div class="share-preview-card">
        <div class="share-preview-icon">${badge.icon || '🏅'}</div>
        <div class="share-preview-title">${escHtml(badge.title)}</div>
        <div class="share-preview-desc">${escHtml(badge.description || '')}</div>
        <div class="share-preview-brand">PrepIQ &middot; +${badge.xp || 0} XP</div>
      </div>

      <h3 class="share-modal-heading">Share your achievement</h3>

      <div class="share-options">
        <a class="share-option share-option-x" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}">
          <span class="share-option-icon">𝕏</span><span>Share on X</span>
        </a>
        <button class="share-option share-option-linkedin" id="shareLinkedinBtn" type="button">
          <span class="share-option-icon">in</span><span>Share on LinkedIn</span>
        </button>
        <a class="share-option share-option-whatsapp" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}">
          <span class="share-option-icon">💬</span><span>Share on WhatsApp</span>
        </a>
        <button class="share-option share-option-copy" id="copyShareLink" type="button">
          <span class="share-option-icon">🔗</span><span>Copy to Clipboard</span>
        </button>
      </div>
      <p class="share-linkedin-note" id="linkedinNote" style="display:none">Caption copied! Paste it (Ctrl+V) into your LinkedIn post after the window opens.</p>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById('closeShareMenu').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('copyShareLink').addEventListener('click', () => {
    navigator.clipboard.writeText(text + ' ' + url).then(() => {
      showToast('Copied to clipboard!');
    });
  });

  document.getElementById('shareLinkedinBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(text + ' ' + url).then(() => {
      document.getElementById('linkedinNote').style.display = 'block';
      window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener');
    });
  });
}

document.addEventListener('DOMContentLoaded', loadAchievements);