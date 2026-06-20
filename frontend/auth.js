/* ====================================================
   auth.js — Login / Register logic for PrepIQ
   Uses the Next.js backend API (http://127.0.0.1:3000)
   ==================================================== */

const API_BASE    = window.PREPIQ_API_BASE_URL || 'http://127.0.0.1:3000';
const SESSION_KEY = 'prepiq_session';
const TOKEN_KEY   = 'prepiq_token';

/* ---------- TAB SWITCHER ---------- */
function switchTab(tab) {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin     = document.getElementById('tabLogin');
  const tabRegister  = document.getElementById('tabRegister');
  const indicator    = document.getElementById('tabIndicator');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    indicator.classList.remove('right');
  } else {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    indicator.classList.add('right');
  }
  clearAllErrors();
}

/* ---------- PASSWORD VISIBILITY TOGGLE ---------- */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

/* ---------- PASSWORD STRENGTH ---------- */
function checkStrength(val) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill) return;

  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;

  const levels = [
    { pct: '0%',   color: 'transparent', text: '' },
    { pct: '25%',  color: '#f87171',     text: '🔴 Weak' },
    { pct: '50%',  color: '#f0c060',     text: '🟡 Fair' },
    { pct: '75%',  color: '#a78bfa',     text: '🟣 Good' },
    { pct: '100%', color: '#34d399',     text: '🟢 Strong' },
  ];

  const lvl = levels[score] || levels[0];
  fill.style.width      = val.length ? lvl.pct : '0%';
  fill.style.background = lvl.color;
  label.textContent     = val.length ? lvl.text : '';
}

/* ---------- VALIDATION HELPERS ---------- */
function setError(id, msg)  { const el = document.getElementById(id); if (el) el.textContent = msg; }
function clearError(id)     { setError(id, ''); }
function markInput(inputId, hasError) {
  const el = document.getElementById(inputId);
  if (el) el.classList.toggle('error', hasError);
}

function clearAllErrors() {
  ['loginEmailErr','loginPasswordErr',
   'regFirstNameErr','regLastNameErr','regEmailErr','regRoleErr','regPasswordErr','regConfirmErr']
    .forEach(clearError);
  ['loginEmail','loginPassword',
   'regFirstName','regLastName','regEmail','regRole','regPassword','regConfirm']
    .forEach(id => markInput(id, false));
  hideFormError('loginError');
  hideFormError('regError');
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
}
function hideFormError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('visible');
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- LOADING STATE ---------- */
function setLoading(submitId, loaderId, loading) {
  const btn    = document.getElementById(submitId);
  const loader = document.getElementById(loaderId);
  if (!btn || !loader) return;
  btn.disabled = loading;
  loader.style.display = loading ? 'block' : 'none';
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
  toast.querySelector('.toast-icon').textContent = type === 'success' ? '✅' : '❌';
  toast.querySelector('.toast-msg').textContent  = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ---------- SESSION HELPERS ---------- */
function saveSession(user, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/* ---------- HANDLE LOGIN ---------- */
async function handleLogin() {
  clearAllErrors();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  let valid = true;

  if (!email) {
    setError('loginEmailErr', 'Email is required.');
    markInput('loginEmail', true); valid = false;
  } else if (!isValidEmail(email)) {
    setError('loginEmailErr', 'Enter a valid email address.');
    markInput('loginEmail', true); valid = false;
  }
  if (!password) {
    setError('loginPasswordErr', 'Password is required.');
    markInput('loginPassword', true); valid = false;
  }
  if (!valid) return;

  setLoading('loginSubmit', 'loginLoader', true);

  try {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showFormError('loginError', data.error || 'Login failed. Please try again.');
      if (res.status === 401) markInput('loginPassword', true);
      return;
    }

    saveSession(data.user, data.token);
    showToast('Welcome back, ' + data.user.firstName + '! 🎉');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);

  } catch (err) {
    const offline = !navigator.onLine ||
                    err?.message?.includes('Failed to fetch') ||
                    err?.message?.includes('NetworkError');
    showFormError('loginError', offline
      ? 'Cannot reach the server. Make sure the backend is running (cd backend && npm run dev).'
      : 'Login failed. Please try again.');
  } finally {
    setLoading('loginSubmit', 'loginLoader', false);
  }
}

/* ---------- HANDLE REGISTER ---------- */
async function handleRegister() {
  clearAllErrors();

  const firstName = document.getElementById('regFirstName').value.trim();
  const college   = document.getElementById('regCollege')?.value.trim() || '';
  const lastName  = document.getElementById('regLastName').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const role      = document.getElementById('regRole').value;
  const password  = document.getElementById('regPassword').value;
  const confirm   = document.getElementById('regConfirm').value;
  const agreed    = document.getElementById('agreeTerms').checked;
  let valid = true;

  if (!firstName) { setError('regFirstNameErr', 'First name is required.'); markInput('regFirstName', true); valid = false; }
  if (!lastName)  { setError('regLastNameErr',  'Last name is required.');  markInput('regLastName',  true); valid = false; }
  if (!email) {
    setError('regEmailErr', 'Email is required.'); markInput('regEmail', true); valid = false;
  } else if (!isValidEmail(email)) {
    setError('regEmailErr', 'Enter a valid email address.'); markInput('regEmail', true); valid = false;
  }
  if (!role) { setError('regRoleErr', 'Please select your target role.'); markInput('regRole', true); valid = false; }
  if (!password) {
    setError('regPasswordErr', 'Password is required.'); markInput('regPassword', true); valid = false;
  } else if (password.length < 8) {
    setError('regPasswordErr', 'Password must be at least 8 characters.'); markInput('regPassword', true); valid = false;
  }
  if (!confirm) {
    setError('regConfirmErr', 'Please confirm your password.'); markInput('regConfirm', true); valid = false;
  } else if (password !== confirm) {
    setError('regConfirmErr', 'Passwords do not match.'); markInput('regConfirm', true); valid = false;
  }
  if (!agreed) { showFormError('regError', 'You must agree to the Terms of Service to register.'); valid = false; }
  if (!valid) return;

  setLoading('registerSubmit', 'registerLoader', true);

  try {
    const res  = await fetch(`${API_BASE}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firstName, lastName, email, password, role, college }),
    });
    const data = await res.json();

    if (!res.ok) {
      showFormError('regError', data.error || 'Registration failed. Please try again.');
      return;
    }

    saveSession(data.user, data.token);
    showToast('Welcome to PrepIQ, ' + data.user.firstName + '! 🚀', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);

  } catch (err) {
    const offline = !navigator.onLine ||
                    err?.message?.includes('Failed to fetch') ||
                    err?.message?.includes('NetworkError');
    showFormError('regError', offline
      ? 'Cannot reach the server. Make sure the backend is running (cd backend && npm run dev).'
      : 'Registration failed. Please try again.');
  } finally {
    setLoading('registerSubmit', 'registerLoader', false);
  }
}

/* ---------- SOCIAL LOGIN (placeholder) ---------- */
function handleSocialLogin(provider) {
  const API = window.PREPIQ_API_BASE_URL || 'http://127.0.0.1:3000';
  if (provider === 'Google') {
    window.location.href = API + '/api/auth/google';
  } else if (provider === 'GitHub') {
    window.location.href = API + '/api/auth/github';
  }
}

/* ---------- TESTIMONIAL AUTO-ROTATE ---------- */
(function initTestimonials() {
  const items = document.querySelectorAll('.testimonial');
  const dots  = document.querySelectorAll('.t-dot');
  if (!items.length) return;
  let cur = 0, autoInterval;

  function rotateTo(idx) {
    items[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    cur = (idx + items.length) % items.length;
    items[cur].classList.add('active');
    dots[cur].classList.add('active');
  }
  function restartAuto() {
    clearInterval(autoInterval);
    autoInterval = setInterval(() => rotateTo(cur + 1), 4000);
  }
  dots.forEach((d, i) => d.addEventListener('click', () => { rotateTo(i); restartAuto(); }));
  restartAuto();
})();

/* ---------- ENTER KEY SUPPORT ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const loginVisible = !document.getElementById('loginForm')?.classList.contains('hidden');
  if (loginVisible) handleLogin();
  else              handleRegister();
});

/* ================================================================
   FIX: The infinite redirect loop bug.

   Previously auth.js ran checkAlreadyLoggedIn() unconditionally.
   Since auth.js is also loaded on index.html, after a successful
   register/login the flow was:
     1. saveSession() → location.href = 'index.html'
     2. index.html loads auth.js
     3. checkAlreadyLoggedIn() sees session → location.replace('index.html')
     4. GOTO 2  →  infinite loop / hang

   Fix: only redirect when we are actually on the auth page.
   ================================================================ */
(function checkAlreadyLoggedIn() {
  const onAuthPage = window.location.pathname.endsWith('auth.html') ||
                     window.location.pathname.endsWith('/auth');
  if (!onAuthPage) return;   // ← this one line fixes the hang

  if (getSession()) {
    window.location.replace('index.html');
    return;
  }

  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab === 'register') switchTab('register');
})();

