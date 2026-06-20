/* ====================================================
   interview.js — AI Mock Interview page logic
   ==================================================== */


let activeInterview = null;
let currentQIndex   = 0;

/* ---------- LOAD HISTORY ---------- */
async function loadInterviewHistory() {
  try {
    const res  = await authFetch(`${API}/api/interview`);
    const data = await res.json();
    const el   = document.getElementById('interviewHistoryList');
    if (!data.interviews?.length) {
      el.innerHTML = '<div class="empty-state">No interviews yet. Start one above!</div>';
      return;
    }
    const typeIcons = { HR:'👥', Technical:'💻', Behavioral:'🧠', Coding:'⌨️', Resume:'📄' };
    el.innerHTML = data.interviews.slice(0, 5).map(iv => `
      <div class="hist-item" data-id="${iv._id}" data-status="${iv.status}" style="${iv.status === 'in_progress' ? 'cursor:pointer' : ''}">
        <div class="hist-icon">${typeIcons[iv.type] || '🎤'}</div>
        <div class="hist-body">
          <div class="hist-title">${iv.type} Interview</div>
          <div class="hist-meta">${fmtDate(iv.createdAt)} • ${iv.status === 'completed' ? `Score: ${iv.overallScore}/100` : 'In Progress'}</div>
        </div>
        <div class="hist-score ${iv.overallScore >= 70 ? 'good' : iv.overallScore >= 40 ? 'avg' : 'low'}">
          ${iv.status === 'completed' ? iv.overallScore + '%' : '…'}
        </div>
      </div>`).join('');
  } catch {}
}


/* ---------- RESUME INTERVIEW ---------- */
async function resumeInterview(id) {
  try {
    const res  = await authFetch(`${API}/api/interview/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    activeInterview = data.interview;
    const firstUnanswered = activeInterview.questions.findIndex(q => !q.userAnswer);
    currentQIndex = firstUnanswered === -1 ? activeInterview.questions.length - 1 : firstUnanswered;

    showInterviewScreen();
    renderQuestion();
  } catch (err) {
    showToast('Failed to resume interview: ' + (err.message || 'Unknown error'), 'error');
  }
}
/* ---------- START INTERVIEW ---------- */
async function startInterview(type) {
  const user = getSession();
  showToast(`Starting ${type} interview…`, 'info');

  try {
    const res  = await authFetch(`${API}/api/interview`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, role: user?.targetRole }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    activeInterview = data.interview;
    currentQIndex   = 0;
    showInterviewScreen();
    renderQuestion();
  } catch (err) {
    showToast('Failed to start interview: ' + (err.message || 'Unknown error'), 'error');
  }
}

/* ---------- SHOW INTERVIEW SCREEN ---------- */
function showInterviewScreen() {
  document.getElementById('interviewStart').style.display  = 'none';
  document.getElementById('interviewActive').style.display = 'block';
  document.getElementById('interviewResults').style.display = 'none';

  const typeIcons = { HR:'👥', Technical:'💻', Behavioral:'🧠', Coding:'⌨️' };
  document.getElementById('interviewTypeBadge').textContent = `${typeIcons[activeInterview.type] || '🎤'} ${activeInterview.type}`;
  document.getElementById('interviewTitle').textContent     = `${activeInterview.type} Interview`;
}

/* ---------- RENDER CURRENT QUESTION ---------- */
function renderQuestion() {
  const q     = activeInterview.questions[currentQIndex];
  const total = activeInterview.questions.length;

  document.getElementById('iqNum').textContent  = `Q${currentQIndex + 1}`;
  document.getElementById('iqText').textContent = q.question;
  document.getElementById('qProgress').textContent = `Q ${currentQIndex + 1} / ${total}`;
  document.getElementById('progFill').style.width  = `${((currentQIndex + 1) / total) * 100}%`;
  document.getElementById('answerBox').value        = q.userAnswer || '';
  document.getElementById('answerFeedback').style.display = 'none';
  document.getElementById('answerBox').disabled   = false;
  const subBtn = document.getElementById('submitAnswerBtn');
  subBtn.style.display = 'inline-flex';
  subBtn.disabled = false;
  subBtn.textContent = subBtn.dataset.label || subBtn.textContent;

  const hint = activeInterview.type === 'Coding'
    ? 'Write your code or explain your approach'
    : 'Aim for 3–5 sentences. Use the STAR method for behavioral questions.';
  document.getElementById('answerHint').textContent = hint;

  // If already answered — show feedback immediately
  if (q.userAnswer && q.aiFeedback) {
    showFeedback(q);
  }
}

/* ---------- SUBMIT ANSWER ---------- */
async function submitAnswer() {
  const answer = document.getElementById('answerBox').value.trim();
  if (!answer) { showToast('Please write an answer before submitting.', 'error'); return; }

  const btn = document.getElementById('submitAnswerBtn');
  btn.textContent = 'Evaluating…';
  btn.disabled    = true;

  try {
    const res  = await authFetch(`${API}/api/interview/${activeInterview._id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ questionIndex: currentQIndex, answer }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Update local interview state
    activeInterview = data.interview;
    const q = activeInterview.questions[currentQIndex];
    showFeedback(q);
    document.getElementById('answerBox').disabled = true;
  } catch (err) {
    showToast('Evaluation failed: ' + (err.message || 'Try again'), 'error');
    btn.textContent = 'Submit Answer →';
    btn.disabled    = false;
  }
}

/* ---------- SHOW FEEDBACK ---------- */
function showFeedback(q) {
  const fb = document.getElementById('answerFeedback');
  fb.style.display = 'block';

  const score  = q.score || 0;
  const rating = score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : score >= 4 ? 'Fair' : 'Needs Work';
  const color  = score >= 8 ? 'var(--green)' : score >= 6 ? 'var(--accent)' : score >= 4 ? 'var(--gold)' : 'var(--red)';

  document.getElementById('feedbackScore').textContent  = `${score}/10`;
  document.getElementById('feedbackScore').style.color  = color;
  document.getElementById('feedbackRating').textContent = rating;
  document.getElementById('feedbackText').textContent   = q.aiFeedback || '';

  const strEl = document.getElementById('feedbackStrengths');
  const wkEl  = document.getElementById('feedbackWeaknesses');
  strEl.innerHTML = (q.strengths || []).map(s => `<li>${escHtml(s)}</li>`).join('') || '<li>—</li>';
  wkEl.innerHTML  = (q.weaknesses || []).map(w => `<li>${escHtml(w)}</li>`).join('') || '<li>—</li>';

  const nextBtn = document.getElementById('nextQuestionBtn');
  const isLast  = currentQIndex >= activeInterview.questions.length - 1;
  nextBtn.textContent = isLast ? 'Finish Interview →' : 'Next Question →';
  document.getElementById('submitAnswerBtn').style.display = 'none';
}

/* ---------- NEXT QUESTION / FINISH ---------- */
async function nextQuestion() {
  const isLast = currentQIndex >= activeInterview.questions.length - 1;
  if (isLast) {
    await finishInterview();
  } else {
    currentQIndex++;
    renderQuestion();
  }
}

/* ---------- FINISH INTERVIEW ---------- */
async function finishInterview() {
  try {
    const res  = await authFetch(`${API}/api/interview/${activeInterview._id}`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    activeInterview = data.interview;
    if (data.newBadges?.length) showBadgeToast(data.newBadges);
    showResults();
  } catch (err) {
    showToast('Failed to complete interview: ' + err.message, 'error');
  }
}

/* ---------- SHOW RESULTS ---------- */
function showResults() {
  document.getElementById('interviewActive').style.display  = 'none';
  document.getElementById('interviewResults').style.display = 'block';

  const iv    = activeInterview;
  const score = iv.overallScore || 0;
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--gold)' : 'var(--red)';

  document.getElementById('resultsScore').textContent           = score;
  document.getElementById('resultsScore').style.color           = color;
  document.getElementById('resultsScoreRing').style.borderColor = color;
  document.getElementById('resultsTitle').textContent           = score >= 70 ? '🎉 Great Interview!' : score >= 40 ? '👍 Good Effort!' : '💪 Keep Practicing!';
  document.getElementById('resultsSummary').textContent         = iv.summary || '';
  document.getElementById('resultsXP').textContent              = `+${iv.xpEarned || 50} XP earned`;

  const strEl = document.getElementById('resultsStrengths');
  const impEl = document.getElementById('resultsImprovements');
  strEl.innerHTML = (iv.strengths || ['Completed the interview — great start!']).map(s => `<li>${escHtml(s)}</li>`).join('');
  impEl.innerHTML = (iv.improvements || ['Continue practicing for better results.']).map(i => `<li>${escHtml(i)}</li>`).join('');
}

/* ---------- EVENT BINDINGS ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadInterviewHistory();

  document.getElementById('interviewHistoryList')?.addEventListener('click', e => {
    const item = e.target.closest('.hist-item');
    if (!item) return;
    if (item.dataset.status === 'in_progress') resumeInterview(item.dataset.id);
  });

  // Interview type cards
  document.querySelectorAll('.interview-type-card').forEach(card => {
    card.addEventListener('click', () => startInterview(card.dataset.type));
  });

  document.getElementById('submitAnswerBtn')?.addEventListener('click', submitAnswer);
  document.getElementById('nextQuestionBtn')?.addEventListener('click', nextQuestion);

  // Allow Ctrl+Enter to submit
  document.getElementById('answerBox')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.ctrlKey) submitAnswer();
  });
});




/* ---------- ADMIN: ALL INTERVIEWS ---------- */
let aiPage = 1;
let aiStatus = "";
let aiType = "";

function fmtDate2(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escHtml2(str) {
  return String(str || "").replace(/[&<>"']/g, function(c) {
    var map = { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" };
    return map[c];
  });
}

async function loadAdminInterviews() {
  var body = document.getElementById("aiBody");
  var errEl = document.getElementById("aiError");
  if (!body) return;
  errEl.textContent = "";
  body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">Loading...</td></tr>";

  try {
    var params = new URLSearchParams({ page: aiPage, limit: 20 });
    if (aiStatus) params.set("status", aiStatus);
    if (aiType) params.set("type", aiType);

    var res = await authFetch(API + "/api/admin/interviews?" + params.toString());
    var data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.interviews || !data.interviews.length) {
      body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">No interviews found.</td></tr>";
      document.getElementById("aiPagination").innerHTML = "";
      return;
    }

    body.innerHTML = data.interviews.map(function(iv) {
      var u = iv.user || {};
      return "<tr>"
        + "<td>" + escHtml2((u.firstName || "") + " " + (u.lastName || "")) + "</td>"
        + "<td>" + escHtml2(u.email) + "</td>"
        + "<td>" + escHtml2(iv.type) + "</td>"
        + "<td>" + (iv.status === "completed" ? "Completed" : "In Progress") + "</td>"
        + "<td>" + (iv.status === "completed" ? (iv.overallScore + "%") : "-") + "</td>"
        + "<td>" + fmtDate2(iv.createdAt) + "</td>"
        + "</tr>";
    }).join("");

    var pag = document.getElementById("aiPagination");
    if (data.pages > 1) {
      var html = "";
      for (var i = 1; i <= data.pages; i++) {
        html += "<button class=\"admin-page-btn " + (i === aiPage ? "active" : "") + "\" data-page=\"" + i + "\">" + i + "</button>";
      }
      pag.innerHTML = html;
      pag.querySelectorAll(".admin-page-btn").forEach(function(btn) {
        btn.addEventListener("click", function() { aiPage = Number(btn.dataset.page); loadAdminInterviews(); });
      });
    } else {
      pag.innerHTML = "";
    }
  } catch (err) {
    errEl.textContent = err.message || "Failed to load interviews.";
    body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">Could not load interviews.</td></tr>";
  }
}

document.addEventListener("DOMContentLoaded", function() {
  var user = getSession();
  if (user && user.isAdmin) {
    document.getElementById("interviewStart").style.display = "none";
    document.getElementById("adminInterviewsView").style.display = "block";
    loadAdminInterviews();

    var filterBtn = document.getElementById("aiFilterBtn");
    if (filterBtn) filterBtn.addEventListener("click", function() {
      aiStatus = document.getElementById("aiStatusFilter").value;
      aiType = document.getElementById("aiTypeFilter").value;
      aiPage = 1;
      loadAdminInterviews();
    });
  }
});
