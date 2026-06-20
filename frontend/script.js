/* ====================================================
   script.js — Homepage logic for PrepIQ
   ==================================================== */

/* ---------- SLIDER ---------- */
const slides = document.querySelectorAll('.slide');
const dots   = document.querySelectorAll('.slide-dots .dot');
let current  = 0;
let timer;

function goTo(idx) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (idx + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');

  // Update aria-selected on dot tabs
  dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === current)));

  resetTimer();
}

function next() { goTo(current + 1); }

function resetTimer() {
  clearInterval(timer);
  timer = setInterval(next, 3500);
}

// Pause auto-play when user is not on the page
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInterval(timer);
  else resetTimer();
});

resetTimer();

/* ---------- SESSION HELPERS ---------- */
const HOME_SESSION_KEY = 'prepiq_session';

function getSession() {
  try { return JSON.parse(localStorage.getItem(HOME_SESSION_KEY)); }
  catch { return null; }
}

function clearSession() {
  localStorage.removeItem(HOME_SESSION_KEY);
}

function getInitials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
}

/* ---------- BUILD PROFILE DROPDOWN ---------- */
function buildDropdown(user) {
  // Remove any stale dropdown
  document.getElementById('profileDropdown')?.remove();

  const initials = getInitials(user.firstName, user.lastName);

  const dd = document.createElement('div');
  dd.className = 'profile-dropdown';
  dd.id = 'profileDropdown';
  dd.setAttribute('role', 'menu');
  dd.setAttribute('aria-label', 'Profile menu');
  dd.innerHTML = `
    <div class="pd-header">
      <div class="pd-avatar" aria-hidden="true">${initials}</div>
      <div>
        <div class="pd-name">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</div>
        <div class="pd-role">${escapeHtml(user.role || 'PrepIQ Member')}</div>
        <div class="pd-email">${escapeHtml(user.email)}</div>
      </div>
    </div>

    <div class="pd-stats" aria-label="Your stats">
      <div class="pd-stat">
        <div class="pd-stat-num">${user.practiceCount ?? 0}</div>
        <div class="pd-stat-label">Sessions</div>
      </div>
      <div class="pd-stat">
        <div class="pd-stat-num">${user.streak ?? 0}</div>
        <div class="pd-stat-label">Day Streak</div>
      </div>
      <div class="pd-stat">
        <div class="pd-stat-num">${user.score ?? 0}</div>
        <div class="pd-stat-label">Score</div>
      </div>
    </div>

    <ul class="pd-menu" role="none">
      <li role="none"><a href="pages/profile.html" role="menuitem">👤&nbsp; My Profile</a></li>
      <li role="none"><a href="pages/analytics.html" role="menuitem">📊&nbsp; My Progress</a></li>
      <li role="none"><a href="pages/questions.html" role="menuitem">📚&nbsp; Practice History</a></li>
      <li role="none"><a href="pages/profile.html" role="menuitem">⚙️&nbsp; Account Settings</a></li>
      <li class="pd-divider" role="separator"></li>
      <li class="pd-danger" role="none">
        <button id="logoutBtn" role="menuitem">🚪&nbsp; Logout</button>
      </li>
    </ul>
  `;

  document.body.appendChild(dd);

  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    showToast('Logged out successfully. See you soon! 👋', 'success');
    setTimeout(() => location.reload(), 800);
  });

  // Close on outside click — use { once: false } but only attach a single listener
  // attached once so there's no accumulation across multiple buildDropdown calls.
  // We use a named reference so we can remove it if needed.
  function handleOutsideClick(e) {
    const avatar = document.getElementById('profileAvatar');
    if (!dd.contains(e.target) && e.target !== avatar) {
      dd.classList.remove('open');
      avatar?.setAttribute('aria-expanded', 'false');
    }
  }

  // Store reference on the element so we can clean it up if dropdown is rebuilt
  dd._outsideClickHandler = handleOutsideClick;
  document.addEventListener('click', handleOutsideClick);

  return dd;
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
    toast.innerHTML = '<span class="toast-icon" aria-hidden="true"></span><span class="toast-msg"></span>';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.querySelector('.toast-icon').textContent = type === 'success' ? '✅' : '❌';
  toast.querySelector('.toast-msg').textContent  = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ---------- HTML ESCAPE HELPER ---------- */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- INIT NAV BASED ON SESSION ---------- */
(function initNav() {
  const user     = getSession();
  const loginBtn = document.getElementById('loginBtn');
  const regBtn   = document.getElementById('registerBtn');
  const avatar   = document.getElementById('profileAvatar');

  if (!user) {
    // Not logged in — buttons already link to auth.html via href; nothing extra needed
    return;
  }

  // Logged in — hide login/register buttons, show avatar
  if (loginBtn) loginBtn.style.display = 'none';
  if (regBtn)   regBtn.style.display   = 'none';
  const dashBtn = document.getElementById('dashboardBtn');
  if (dashBtn) dashBtn.style.display = 'inline-flex';
  if (avatar) {
    avatar.style.display = 'flex';
    avatar.textContent   = getInitials(user.firstName, user.lastName);
    avatar.setAttribute('aria-label', `${user.firstName} ${user.lastName} — profile menu`);
  }

  // Welcome toast (shown once per browser session, not once per page load)
  if (sessionStorage.getItem('prepiq_welcomed') !== '1') {
    showToast(`Welcome back, ${user.firstName}! 👋`);
    sessionStorage.setItem('prepiq_welcomed', '1');
  }

  // Build dropdown and wire toggle
  const dropdown = buildDropdown(user);

  avatar?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    avatar.setAttribute('aria-expanded', String(isOpen));
  });

  // Keyboard support: open with Enter/Space
  avatar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      avatar.click();
    }
  });
})();

/* ---------- PRACTICE LAB TABS ---------- */
const labTabs   = document.querySelectorAll('.lab-tab');
const labPanels = document.querySelectorAll('.lab-panel');

labTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.lab;

    labTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    labPanels.forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`lab-${target}`)?.classList.add('active');
  });
});

/* ---------- RESUME ANALYSIS ---------- */
const resumeFile        = document.getElementById('resumeFile');
const resumeFileName    = document.getElementById('resumeFileName');
const resumeResult      = document.getElementById('resumeResult');
const resumeUploadForm  = document.getElementById('resumeUploadForm');
const resumeRole        = document.getElementById('resumeRole');
const resumeAnalyzeBtn  = document.getElementById('resumeAnalyzeBtn');
const PREPIQ_API_BASE   = window.PREPIQ_API_BASE_URL || 'http://127.0.0.1:3000';
const PDF_MIME_TYPES    = ['application/pdf', 'application/x-pdf'];

function setResumeLoading(loading) {
  if (!resumeAnalyzeBtn) return;
  resumeAnalyzeBtn.disabled    = loading;
  resumeAnalyzeBtn.textContent = loading ? 'Analyzing Resume...' : 'Analyze Resume';
}

function arrayBufferToBase64(buffer) {
  const bytes     = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary      = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function isPdfFile(file) {
  if (!file) return false;
  const name = String(file.name || '').toLowerCase();
  return name.endsWith('.pdf') || PDF_MIME_TYPES.includes(String(file.type || '').toLowerCase());
}

function renderKeywordChips(items) {
  if (!items?.length) {
    return '<span class="analysis-muted">No role-specific keywords were matched yet.</span>';
  }
  return `
    <div class="analysis-chips">
      ${items.map(item => `<span class="analysis-chip">${escapeHtml(item)}</span>`).join('')}
    </div>
  `;
}

function renderList(items, fallback) {
  const values = items?.length ? items : [fallback];
  return `<ul>${values.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderBreakdown(items) {
  if (!items?.length) return '';
  return `
    <div class="analysis-breakdown">
      ${items.map(item => {
        const pct = Math.round(Math.min(100, Math.max(0, (item.score / item.max) * 100)));
        return `
          <div class="analysis-breakdown-item">
            <div class="analysis-breakdown-head">
              <span>${escapeHtml(item.label)}</span>
              <strong>${item.score}/${item.max}</strong>
            </div>
            <div class="analysis-bar"><span style="width:${pct}%"></span></div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderResumeAnalysis(data) {
  resumeResult.classList.remove('resume-result-empty');
  resumeResult.innerHTML = `
    <div class="resume-analysis">
      <div class="analysis-hero">
        <div class="analysis-score-block">
          <div class="analysis-score">${escapeHtml(String(data.atsScore))}</div>
          <div class="analysis-score-label">${escapeHtml(data.rating || 'ATS Score')}</div>
        </div>
        <div class="analysis-summary">
          <span class="analysis-role">ATS Match for ${escapeHtml(data.targetRole)}</span>
          <h4>${escapeHtml(data.summary)}</h4>
          <p>${escapeHtml(data.fileName)} — analyzed using contact details, core resume sections, keyword relevance, and formatting signals.</p>
          ${renderKeywordChips(data.matchedKeywords?.slice(0, 8))}
        </div>
      </div>
      ${renderBreakdown(data.breakdown || [])}
      <div class="analysis-columns">
        <div class="analysis-column">
          <h5>Strengths</h5>
          ${renderList(data.strengths, 'Add more measurable project outcomes to surface stronger wins.')}
        </div>
        <div class="analysis-column">
          <h5>Improvements</h5>
          ${renderList(data.improvements, 'Resume looks solid. Tailor it further with role-specific keywords.')}
        </div>
      </div>
      <div class="analysis-keywords">
        <strong>Missing Keywords</strong>
        <p class="analysis-muted">${
          data.missingKeywords?.length
            ? escapeHtml(data.missingKeywords.join(', '))
            : 'No major keyword gaps were found for this target role.'
        }</p>
      </div>
    </div>
  `;
}

resumeFile?.addEventListener('change', () => {
  const file = resumeFile.files?.[0];
  resumeFileName.textContent = file ? file.name : 'No file selected';

  if (file && !isPdfFile(file)) {
    resumeFile.value = '';
    resumeFileName.textContent = 'Only PDF files are allowed';
    resumeResult.classList.add('resume-result-empty');
    resumeResult.textContent = 'Please upload a PDF resume only.';
    showToast('Only PDF resumes are supported.', 'error');
  }
});

resumeUploadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file       = resumeFile?.files?.[0];
  const targetRole = resumeRole?.value.trim() || 'Software Engineer';

  if (!file) {
    resumeResult.textContent = 'Please choose a PDF resume before analyzing.';
    showToast('Please upload your resume first.', 'error');
    return;
  }

  if (!isPdfFile(file)) {
    resumeResult.classList.add('resume-result-empty');
    resumeResult.textContent = 'Please upload a PDF resume only.';
    showToast('Only PDF resumes are supported.', 'error');
    return;
  }

  setResumeLoading(true);
  resumeResult.classList.add('resume-result-empty');
  resumeResult.textContent = 'Reading resume and calculating ATS score…';

  try {
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(`${PREPIQ_API_BASE}/api/resume/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName:       file.name,
        fileType:       file.type,
        fileDataBase64: arrayBufferToBase64(fileBuffer),
        targetRole,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Resume analysis failed.');
    }

    renderResumeAnalysis(payload);
    showToast('ATS analysis completed.');
  } catch (error) {
    const isFetchError = error?.message?.includes('Failed to fetch') ||
                         error?.message?.includes('NetworkError');
    const message = isFetchError
      ? 'Next.js backend is not reachable. Start it with: cd backend && npm install && npm run dev'
      : (error?.message || 'Unable to analyze the resume right now.');

    resumeResult.classList.add('resume-result-empty');
    resumeResult.textContent = message;
    showToast('Resume analysis failed.', 'error');
  } finally {
    setResumeLoading(false);
  }
});

/* ---------- QUESTION SET RENDERER ---------- */
function buildQuestionSetHtml(kind, name, data) {
  const prefix = `${kind}-${name.replace(/\s+/g, '-').toLowerCase()}`;
  return `
    <div class="practice-session">
      <div class="practice-head">
        <div>
          <span>${kind === 'aptitude' ? 'Aptitude Round' : 'Technical Quiz'}</span>
          <h4>${escapeHtml(data.title)}</h4>
        </div>
        <strong>${data.questions.length} questions</strong>
      </div>
      <form class="practice-form" novalidate>
        ${data.questions.map((q, i) => `
          <fieldset class="practice-question">
            <legend>${i + 1}. ${escapeHtml(q.question)}</legend>
            <div class="practice-options">
              ${q.options.map((opt, oi) => `
                <label class="practice-option">
                  <input type="radio" name="${prefix}-${q.id}" value="${oi}" />
                  <span>${escapeHtml(opt)}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>
        `).join('')}
        <button class="btn-primary" type="submit">Submit Answers</button>
      </form>
      <div class="practice-feedback" aria-live="polite"></div>
    </div>
  `;
}

function collectAnswers(kind, name, questions) {
  const prefix  = `${kind}-${name.replace(/\s+/g, '-').toLowerCase()}`;
  const answers = {};
  questions.forEach(q => {
    const sel = document.querySelector(`input[name="${prefix}-${q.id}"]:checked`);
    if (sel) answers[q.id] = Number(sel.value);
  });
  return answers;
}

function renderPracticeScore(feedbackEl, data) {
  feedbackEl.innerHTML = `
    <div class="practice-score">
      <strong>${data.score}/${data.total}</strong>
      <span>${data.percentage}% score in ${escapeHtml(data.title)}</span>
    </div>
    <div class="practice-review-list">
      ${data.results.map((r, i) => `
        <div class="practice-review-item ${r.correct ? 'correct' : 'incorrect'}">
          <strong>${i + 1}. ${r.correct ? 'Correct ✓' : 'Review ✗'}</strong>
          <p>${escapeHtml(r.explanation)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

async function loadQuestionPractice({ kind, name, resultEl }) {
  const endpoint  = kind === 'aptitude' ? 'aptitude' : 'quiz';
  const queryName = kind === 'aptitude' ? 'test'     : 'topic';

  resultEl.textContent = `Loading ${name}…`;

  try {
    const res     = await fetch(`${PREPIQ_API_BASE}/api/practice/${endpoint}?${queryName}=${encodeURIComponent(name)}`, { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('prepiq_token') || '') } });
    const payload = await res.json();

    if (!res.ok) throw new Error(payload.error || 'Unable to load practice questions.');

    resultEl.innerHTML = buildQuestionSetHtml(kind, name, payload);

    const form       = resultEl.querySelector('.practice-form');
    const feedbackEl = resultEl.querySelector('.practice-feedback');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const answers = collectAnswers(kind, name, payload.questions);

      if (Object.keys(answers).length !== payload.questions.length) {
        feedbackEl.textContent = 'Please answer every question before submitting.';
        showToast('Answer all questions first.', 'error');
        return;
      }

      try {
        const scoreRes     = await fetch(`${PREPIQ_API_BASE}/api/practice/${endpoint}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('prepiq_token') || '') },
          body:    JSON.stringify({ [queryName]: name, answers }),
        });
        const scorePayload = await scoreRes.json();

        if (!scoreRes.ok) throw new Error(scorePayload.error || 'Unable to score answers.');

        renderPracticeScore(feedbackEl, scorePayload);
        showToast(`${scorePayload.title}: ${scorePayload.score}/${scorePayload.total}`);
      } catch (err) {
        feedbackEl.textContent = err?.message || 'Unable to score answers.';
        showToast('Scoring failed.', 'error');
      }
    });

    showToast(`${payload.title} loaded.`);
  } catch (error) {
    resultEl.textContent = error?.message || 'Unable to load practice questions.';
    showToast('Practice loading failed.', 'error');
  }
}

/* ---------- CODING PRACTICE ---------- */
function renderCodingChallenge(resultEl, challenge) {
  resultEl.innerHTML = `
    <div class="coding-challenge">
      <div class="practice-head">
        <div>
          <span>${escapeHtml(challenge.difficulty)} / ${escapeHtml(challenge.topic)}</span>
          <h4>${escapeHtml(challenge.title)}</h4>
        </div>
        <strong>Challenge</strong>
      </div>
      <p class="coding-prompt">${escapeHtml(challenge.prompt)}</p>
      <div class="coding-meta">
        <div>
          <strong>Example</strong>
          <p>${escapeHtml(challenge.examples?.[0] || 'Build a working solution for the prompt above.')}</p>
        </div>
        <div>
          <strong>Hints</strong>
          <ul>${(challenge.hints || []).map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
        </div>
      </div>
      <textarea class="coding-editor" spellcheck="false" aria-label="Code editor">${escapeHtml(challenge.starterCode || '')}</textarea>
      <button class="btn-primary coding-review-btn" type="button">Review Code</button>
      <div class="practice-feedback" aria-live="polite"></div>
    </div>
  `;

  const reviewBtn  = resultEl.querySelector('.coding-review-btn');
  const editor     = resultEl.querySelector('.coding-editor');
  const feedbackEl = resultEl.querySelector('.practice-feedback');

  reviewBtn.addEventListener('click', async () => {
    reviewBtn.disabled    = true;
    reviewBtn.textContent = 'Reviewing…';

    try {
      const res     = await fetch(`${PREPIQ_API_BASE}/api/practice/coding`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('prepiq_token') || '') },
        body:    JSON.stringify({ challengeId: challenge.id, code: editor.value }),
      });
      const payload = await res.json();

      if (!res.ok) throw new Error(payload.error || 'Unable to review code.');

      feedbackEl.innerHTML = `
        <div class="practice-score">
          <strong>${payload.score}%</strong>
          <span>${escapeHtml(payload.rating)}</span>
        </div>
        <div class="practice-review-list">
          ${(payload.feedback || []).map(item => `
            <div class="practice-review-item">
              <p>${escapeHtml(item)}</p>
            </div>
          `).join('')}
        </div>
      `;
      showToast('Coding review completed.');
    } catch (error) {
      feedbackEl.textContent = error?.message || 'Unable to review code.';
      showToast('Coding review failed.', 'error');
    } finally {
      reviewBtn.disabled    = false;
      reviewBtn.textContent = 'Review Code';
    }
  });
}

async function loadCodingPractice() {
  const difficulty = document.getElementById('codingDifficulty').value;
  const topic      = document.getElementById('codingTopic').value;
  const resultEl   = document.getElementById('codingResult');

  resultEl.textContent = `Loading ${difficulty} ${topic} challenge…`;

  try {
    const res     = await fetch(
      `${PREPIQ_API_BASE}/api/practice/coding?difficulty=${encodeURIComponent(difficulty)}&topic=${encodeURIComponent(topic)}`,
      { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('prepiq_token') || '') } }
    );
    const payload = await res.json();

    if (!res.ok) throw new Error(payload.error || 'Unable to load coding challenge.');

    renderCodingChallenge(resultEl, payload);
    showToast('Coding challenge loaded.');
  } catch (error) {
    resultEl.textContent = error?.message || 'Unable to load coding challenge.';
    showToast('Coding challenge failed.', 'error');
  }
}

/* ---------- EVENT BINDINGS ---------- */
document.querySelectorAll('.test-card').forEach(card => {
  card.addEventListener('click', () => {
    loadQuestionPractice({
      kind:     'aptitude',
      name:     card.dataset.test,
      resultEl: document.getElementById('aptitudeResult'),
    });
  });
});

document.querySelectorAll('.quiz-chips button').forEach(btn => {
  btn.addEventListener('click', () => {
    loadQuestionPractice({
      kind:     'quiz',
      name:     btn.dataset.topic,
      resultEl: document.getElementById('quizResult'),
    });
  });
});

document.getElementById('codingStartBtn')?.addEventListener('click', loadCodingPractice);

/* ---------- MOBILE NAV TOGGLE ---------- */
document.getElementById('navHamburger')?.addEventListener('click', () => {
  document.getElementById('navHamburger').classList.toggle('open');
  document.querySelector('.nav-links')?.classList.toggle('open');
});
