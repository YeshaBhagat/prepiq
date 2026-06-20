/* ====================================================
   pages.js — Shared utilities for all app pages
   ==================================================== */

const API           = window.PREPIQ_API_BASE_URL || 'http://127.0.0.1:3000';
const SESSION_KEY   = 'prepiq_session';
const TOKEN_KEY     = 'prepiq_token';

/* ---------- SESSION ---------- */
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function getToken()  { return localStorage.getItem(TOKEN_KEY) || ''; }
function saveSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/* ---------- AUTH GUARD ---------- */
// Call at top of every app page — redirects to login if not authenticated
function requireLogin() {
  const user = getSession();
  if (!user || !getToken()) {
    window.location.replace('../auth.html?tab=login');
    return null;
  }
  return user;
}

/* ---------- AUTHENTICATED FETCH ---------- */
function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/* ---------- TOAST ---------- */
function showToast(msg, type = 'success') {
  let toast = document.getElementById('prepiqToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'prepiqToast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="toast-icon"></span><span class="toast-msg"></span>';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.querySelector('.toast-icon').textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.querySelector('.toast-msg').textContent  = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ---------- BADGE TOAST ---------- */
function showBadgeToast(badges) {
  if (!badges?.length) return;
  badges.forEach((b, i) => {
    setTimeout(() => showToast(`🏆 Badge earned: ${b.icon} ${b.title} (+${b.xp} XP)`, 'success'), i * 800);
  });
}

/* ---------- ESCAPE HTML ---------- */
function escHtml(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ---------- FORMAT DATE ---------- */
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/* ---------- LIVE STAT UPDATE ---------- */
function applyUpdatedStats(updatedStats) {
  if (!updatedStats) return;
  const user = getSession();
  if (!user) return;
  Object.assign(user, updatedStats);
  saveSession(user);
  // refresh dropdown numbers if open
  const nums = document.querySelectorAll('.pd-stat-num');
  if (nums.length >= 3) {
    nums[0].textContent = user.practiceCount ?? 0;
    nums[1].textContent = user.streak        ?? 0;
    nums[2].textContent = user.score         ?? 0;
  }
}

/* ---------- PROFILE DROPDOWN ---------- */
function buildDropdown(user) {
  document.getElementById('profileDropdown')?.remove();
  const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
  const dd = document.createElement('div');
  dd.id = 'profileDropdown';
  dd.className = 'profile-dropdown';
  dd.setAttribute('role', 'menu');
  dd.innerHTML = `
    <div class="pd-header">
      <div class="pd-avatar">${initials}</div>
      <div>
        <div class="pd-name">${escHtml(user.firstName)} ${escHtml(user.lastName)}</div>
        <div class="pd-role">${escHtml(user.targetRole || 'PrepIQ Member')}</div>
        <div class="pd-email">${escHtml(user.email)}</div>
      </div>
    </div>
    <div class="pd-stats">
      <div class="pd-stat"><div class="pd-stat-num">${user.practiceCount ?? 0}</div><div class="pd-stat-label">Sessions</div></div>
      <div class="pd-stat"><div class="pd-stat-num">${user.streak ?? 0}</div><div class="pd-stat-label">Streak</div></div>
      <div class="pd-stat"><div class="pd-stat-num">${user.xp ?? 0}</div><div class="pd-stat-label">XP</div></div>
    </div>
    <ul class="pd-menu" role="none">
      <li role="none"><a href="profile.html"       role="menuitem">👤&nbsp; My Profile</a></li>
      <li role="none"><a href="dashboard.html"     role="menuitem">📊&nbsp; Dashboard</a></li>
      <li role="none"><a href="achievements.html"  role="menuitem">🏆&nbsp; Achievements</a></li>
      <li role="none"><a href="analytics.html"     role="menuitem">📈&nbsp; Analytics</a></li>
      <li class="pd-divider" role="separator"></li>
      <li class="pd-danger" role="none"><button id="logoutBtn" role="menuitem">🚪&nbsp; Logout</button></li>
    </ul>`;
  document.body.appendChild(dd);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    authFetch(`${API}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    clearSession();
    showToast('Logged out. See you soon! 👋');
    setTimeout(() => { window.location.href = '../index.html'; }, 700);
  });

  function outsideClick(e) {
    const av = document.getElementById('profileAvatar');
    if (!dd.contains(e.target) && e.target !== av) {
      dd.classList.remove('open');
      av?.setAttribute('aria-expanded', 'false');
    }
  }
  dd._oc = outsideClick;
  document.addEventListener('click', outsideClick);
  return dd;
}

/* ---------- INIT APP NAV ---------- */
function initAppNav() {
  const user   = getSession();
  const avatar = document.getElementById('profileAvatar');
  if (!user || !avatar) return;

  const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
  avatar.style.display = 'flex';
  avatar.textContent   = initials;
  avatar.setAttribute('aria-label', `${user.firstName} — profile menu`);

  const dropdown = buildDropdown(user);

  avatar.addEventListener('click', e => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('open');
    avatar.setAttribute('aria-expanded', String(open));
  });
  avatar.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avatar.click(); }
  });
}

/* ---------- SKILLS CHIP INPUT ---------- */
function initSkillsInput(inputId, chipsContainerId, skillsArray) {
  const input  = document.getElementById(inputId);
  const chips  = document.getElementById(chipsContainerId);
  if (!input || !chips) return skillsArray;

  function render() {
    chips.innerHTML = skillsArray.map((s, i) =>
      `<span class="skill-chip">${escHtml(s)}<button type="button" data-i="${i}">×</button></span>`
    ).join('');
    chips.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        skillsArray.splice(Number(btn.dataset.i), 1);
        render();
      });
    });
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/,$/, '');
      if (val && !skillsArray.includes(val) && skillsArray.length < 25) {
        skillsArray.push(val);
        input.value = '';
        render();
      }
    }
  });

  render();
  return skillsArray;
}

/* ---------- RUN ON ALL APP PAGES ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const user = requireLogin();
  if (!user) return;
  initAppNav();

  // Welcome toast (once per browser session)
  if (sessionStorage.getItem('prepiq_welcomed') !== '1') {
    showToast(`Welcome back, ${user.firstName}! 👋`);
    sessionStorage.setItem('prepiq_welcomed', '1');
  }
});

/* ---------- MOBILE NAV TOGGLE ---------- */
document.getElementById('navHamburger')?.addEventListener('click', () => {
  document.getElementById('navHamburger').classList.toggle('open');
  document.querySelector('.app-nav-links')?.classList.toggle('open');
});

/* ---------- HIDE ADMIN LINK FOR NON-ADMINS ---------- */
(function() {
  const user = getSession();
  const adminLink = document.querySelector('.app-nav-links a[href="admin.html"]');
  if (adminLink && !user?.isAdmin) {
    adminLink.parentElement?.remove();
  }
})();
