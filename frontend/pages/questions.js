/* ====================================================
   questions.js — Question Bank page logic
   ==================================================== */


let currentPage = 1;
let currentFilters = { category: '', difficulty: '', search: '' };

/* ---------- LOAD QUESTIONS ---------- */
async function loadQuestions(page = 1) {
  currentPage = page;
  const list = document.getElementById('questionList');
  list.innerHTML = '<div class="loading-spinner">Loading questions...</div>';

  const params = new URLSearchParams({ page, limit: 15 });
  if (currentFilters.category)   params.set('category',   currentFilters.category);
  if (currentFilters.difficulty) params.set('difficulty', currentFilters.difficulty);
  if (currentFilters.search)     params.set('search',     currentFilters.search);

  try {
    const res  = await authFetch(`${API}/api/questions?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.questions.length) {
      list.innerHTML = '<div class="empty-state">No questions found. Try different filters.</div>';
      document.getElementById('qPagination').innerHTML = '';
      return;
    }

    list.innerHTML = data.questions.map(q => renderQuestionCard(q)).join('');

    // Wire bookmark buttons
    list.querySelectorAll('.bm-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleBookmark(btn.dataset.id, btn);
      });
    });

    // Wire card click → modal
    list.querySelectorAll('.q-card').forEach(card => {
      card.addEventListener('click', () => openQuestionModal(card.dataset.id, data.questions));
    });

    renderPagination(data.pages, page);
  } catch (err) {
    list.innerHTML = `<div class="empty-state">Failed to load questions: ${escHtml(err.message)}.<br>Make sure the backend is running and questions are seeded.</div>`;
  }
}

/* ---------- RENDER CARD ---------- */
function renderQuestionCard(q) {
  const diffColor = { Easy: 'var(--green)', Medium: 'var(--gold)', Hard: 'var(--red)' }[q.difficulty] || 'var(--muted)';
  const catColors  = { DSA:'#5b6af5', DBMS:'#34d399', OS:'#f0c060', CN:'#a78bfa', OOP:'#f472b6', JavaScript:'#fbbf24', React:'#38bdf8', SQL:'#34d399', HR:'#fb923c', SystemDesign:'#c084fc', Aptitude:'#60a5fa' };
  const catColor   = catColors[q.category] || 'var(--accent)';

  return `
    <div class="q-card" data-id="${q._id}" role="button" tabindex="0" aria-label="${escHtml(q.title)}">
      <div class="q-card-top">
        <span class="q-cat-badge" style="background:${catColor}22;color:${catColor}">${escHtml(q.category)}</span>
        <span class="q-diff-badge" style="color:${diffColor}">${q.difficulty}</span>
        <button class="bm-btn ${q.bookmarked ? 'active' : ''}" data-id="${q._id}" title="${q.bookmarked ? 'Remove bookmark' : 'Bookmark'}" aria-label="Bookmark">
          ${q.bookmarked ? '🔖' : '🏷️'}
        </button>
      </div>
      <div class="q-card-title">${escHtml(q.title)}</div>
      ${q.companies?.length ? `<div class="q-companies">${q.companies.slice(0,3).map(c => `<span class="q-company">${escHtml(c)}</span>`).join('')}</div>` : ''}
      <div class="q-type-badge">${q.type || 'mcq'}</div>
    </div>`;
}

/* ---------- QUESTION MODAL ---------- */
function openQuestionModal(id, questions) {
  const q = questions.find(x => x._id === id);
  if (!q) return;

  const modal = document.getElementById('qModal');
  const content = document.getElementById('qModalContent');
  const diffColor = { Easy: 'var(--green)', Medium: 'var(--gold)', Hard: 'var(--red)' }[q.difficulty] || 'var(--muted)';

  let optionsHtml = '';
  if (q.type === 'mcq' && q.options?.length) {
    optionsHtml = `
      <div class="q-options" id="qOptions">
        ${q.options.map((opt, i) => `
          <button class="q-option-btn" data-i="${i}" type="button">${String.fromCharCode(65+i)}. ${escHtml(opt)}</button>
        `).join('')}
      </div>
      <div class="q-answer-reveal" id="qAnswerReveal" style="display:none">
        <div class="q-correct-ans">✅ Correct Answer: ${String.fromCharCode(65 + q.answer)}. ${escHtml(q.options[q.answer])}</div>
        ${q.explanation ? `<div class="q-explanation">${escHtml(q.explanation)}</div>` : ''}
      </div>`;
  } else {
    optionsHtml = q.explanation
      ? `<div class="q-subjective-ans"><strong>Model Answer / Approach:</strong><p>${escHtml(q.explanation)}</p></div>`
      : '';
  }

  content.innerHTML = `
    <div class="modal-q-header">
      <span class="q-cat-badge" style="background:var(--surface2)">${escHtml(q.category)}</span>
      <span class="q-diff-badge" style="color:${diffColor}">${q.difficulty}</span>
      ${q.type !== 'mcq' ? `<span class="q-type-badge">${q.type}</span>` : ''}
    </div>
    <h3 class="modal-q-title">${escHtml(q.title)}</h3>
    ${q.description !== q.title ? `<p class="modal-q-desc">${escHtml(q.description)}</p>` : ''}
    ${optionsHtml}
    ${q.companies?.length ? `<div class="q-companies" style="margin-top:16px"><strong style="color:var(--muted);font-size:.78rem">ASKED BY: </strong>${q.companies.map(c => `<span class="q-company">${escHtml(c)}</span>`).join('')}</div>` : ''}`;

  modal.classList.add('open');

  // MCQ option selection
  if (q.type === 'mcq') {
    content.querySelectorAll('.q-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.q-option-btn').forEach(b => b.classList.remove('selected', 'correct', 'wrong'));
        const chosen = Number(btn.dataset.i);
        btn.classList.add(chosen === q.answer ? 'correct' : 'wrong');
        if (chosen !== q.answer) {
          content.querySelector(`[data-i="${q.answer}"]`)?.classList.add('correct');
        }
        document.getElementById('qAnswerReveal').style.display = 'block';
      });
    });
  }
}

/* ---------- BOOKMARK ---------- */
async function toggleBookmark(questionId, btn) {
  try {
    const res  = await authFetch(`${API}/api/questions/bookmark`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ questionId }),
    });
    const data = await res.json();
    if (data.bookmarked) { btn.textContent = '🔖'; btn.classList.add('active'); showToast('Bookmarked!'); }
    else                 { btn.textContent = '🏷️'; btn.classList.remove('active'); showToast('Bookmark removed.'); }
  } catch { showToast('Failed to bookmark.', 'error'); }
}

/* ---------- PAGINATION ---------- */
function renderPagination(totalPages, current) {
  const el = document.getElementById('qPagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  if (current > 1) html += `<button class="pg-btn" data-p="${current-1}">← Prev</button>`;
  for (let i = Math.max(1, current-2); i <= Math.min(totalPages, current+2); i++) {
    html += `<button class="pg-btn ${i===current?'active':''}" data-p="${i}">${i}</button>`;
  }
  if (current < totalPages) html += `<button class="pg-btn" data-p="${current+1}">Next →</button>`;
  el.innerHTML = html;
  el.querySelectorAll('.pg-btn').forEach(btn => {
    btn.addEventListener('click', () => loadQuestions(Number(btn.dataset.p)));
  });
}

/* ---------- FILTER EVENTS ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();

  document.getElementById('qFilterBtn')?.addEventListener('click', () => {
    currentFilters.category   = document.getElementById('qCategory').value;
    currentFilters.difficulty = document.getElementById('qDifficulty').value;
    currentFilters.search     = document.getElementById('qSearch').value.trim();
    loadQuestions(1);
  });

  // Enter in search
  document.getElementById('qSearch')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('qFilterBtn').click();
  });

  // Category chips
  document.getElementById('catChips')?.addEventListener('click', e => {
    const btn = e.target.closest('.cat-chip');
    if (!btn) return;
    document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilters.category = btn.dataset.cat;
    document.getElementById('qCategory').value = btn.dataset.cat;
    loadQuestions(1);
  });

  // Modal close
  document.getElementById('qModalClose')?.addEventListener('click', () => {
    document.getElementById('qModal').classList.remove('open');
  });
  document.getElementById('qModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('qModal')) {
      document.getElementById('qModal').classList.remove('open');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('qModal')?.classList.remove('open');
  });
});

