/* ====================================================
   analytics.js — Progress Analytics page logic
   ==================================================== */


async function loadAnalytics(period = '30', userId = null) {
  try {
    let url = `${API}/api/analytics?period=${period}`;
    if (userId) url += '&userId=' + userId;
    const res  = await authFetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    window._latestAnalyticsData = data;
      renderSummary(data.summary);
    renderDailyChart(data.dailyProgress);
    renderTopicBars(data.topicAccuracy);
    renderStrengthWeakness(data.strongTopics, data.weakTopics);
    renderInterviewHist(data.interviewHistory);
    renderSessionsTable(data.recentSessions);
  } catch (err) {
    showToast('Failed to load analytics: ' + (err.message || 'Unknown error'), 'error');
  }
}

function renderSummary(s) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('an-sessions',   s.totalSessions);
  set('an-questions',  s.totalQuestions);
  set('an-avgscore',   s.avgScore + '%');
  set('an-hours',      s.studyHours + 'h');
  set('an-interviews', s.interviewsDone);
  set('an-intscore',   s.avgInterviewScore + '%');
}

function renderDailyChart(daily) {
  const wrap = document.getElementById('dailyChartWrap');
  if (!daily?.length) { wrap.innerHTML = '<div class="empty-state">No session data for this period.</div>'; return; }

  const maxSessions = Math.max(...daily.map(d => d.sessions), 1);
  wrap.innerHTML = `<div class="line-chart-bars">${daily.map(d => {
    const pct = Math.round((d.sessions / maxSessions) * 100);
    const label = d.date.slice(5); // MM-DD
    return `<div class="lc-col">
      <div class="lc-val">${d.sessions || ''}</div>
      <div class="lc-bar-wrap"><div class="lc-bar" style="height:${Math.max(pct, d.sessions ? 3 : 0)}%"></div></div>
      <div class="lc-label">${label}</div>
    </div>`;
  }).join('')}</div>`;
}

function renderTopicBars(topics) {
  const el = document.getElementById('topicBars');
  if (!topics?.length) { el.innerHTML = '<div class="empty-state">Complete quizzes to see data.</div>'; return; }

  el.innerHTML = topics.map(t => {
    const color = t.accuracy >= 70 ? 'var(--green)' : t.accuracy >= 45 ? 'var(--gold)' : 'var(--red)';
    return `<div class="topic-row">
      <div class="topic-name">${escHtml(t.category)}<span class="topic-sessions">${t.sessions}s</span></div>
      <div class="topic-bar-wrap">
        <div class="topic-bar-fill" style="width:${t.accuracy}%;background:${color}"></div>
      </div>
      <div class="topic-pct" style="color:${color}">${t.accuracy}%</div>
    </div>`;
  }).join('');
}

function renderStrengthWeakness(strong, weak) {
  const renderList = (el, items, emptyMsg) => {
    if (!items?.length) { el.innerHTML = `<div class="empty-state">${emptyMsg}</div>`; return; }
    el.innerHTML = items.map(t => {
      const color = t.accuracy >= 70 ? 'var(--green)' : 'var(--red)';
      return `<div class="sw-item"><span>${escHtml(t.category)}</span><span style="color:${color};font-weight:700">${t.accuracy}%</span></div>`;
    }).join('');
  };

  renderList(document.getElementById('strongTopics'), strong, 'Keep practicing to identify strong topics.');
  renderList(document.getElementById('weakTopics'),   weak,   'All topics looking good!');
}

function renderInterviewHist(history) {
  const el = document.getElementById('interviewHistList');
  if (!history?.length) { el.innerHTML = '<div class="empty-state">No interviews completed yet.</div>'; return; }

  const icons = { HR:'👥', Technical:'💻', Behavioral:'🧠', Coding:'⌨️' };
  el.innerHTML = history.map(iv => {
    const color = iv.score >= 70 ? 'var(--green)' : iv.score >= 40 ? 'var(--gold)' : 'var(--red)';
    return `<div class="hist-item">
      <div class="hist-icon">${icons[iv.type] || '🎤'}</div>
      <div class="hist-body">
        <div class="hist-title">${iv.type} Interview</div>
        <div class="hist-meta">${fmtDate(iv.date)}</div>
      </div>
      <div class="hist-score" style="color:${color}">${iv.score}%</div>
    </div>`;
  }).join('');
}

function renderSessionsTable(sessions) {
  const tbody = document.getElementById('sessionsBody');
  if (!sessions?.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No sessions yet.</td></tr>';
    return;
  }
  const typeIcons = { quiz:'📚', aptitude:'🧮', coding:'💻', interview:'🤖', resume:'📄' };
  tbody.innerHTML = sessions.map(s => `
    <tr>
      <td>${fmtDate(s.createdAt)}</td>
      <td>${escHtml(s.category)}</td>
      <td>${typeIcons[s.type] || ''} ${s.type}</td>
      <td>${s.score ?? '—'}${s.type !== 'interview' ? '%' : ''}</td>
      <td>${s.totalQ ?? '—'}</td>
      <td>+${s.xpEarned ?? 0} XP</td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadAnalytics('30');
  document.getElementById('periodSelect')?.addEventListener('change', e => loadAnalytics(e.target.value));
});


/* ---------- ADMIN: PLATFORM ANALYTICS ---------- */
function escHtml4(str) {
  return String(str || "").replace(/[&<>"']/g, function(c) {
    var map = { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" };
    return map[c];
  });
}

async function loadAdminAnalytics() {
  var statsEl = document.getElementById("adminAnalyticsStats");
  var chartEl = document.getElementById("signupsChart");

  try {
    var res = await authFetch(API + "/api/admin/stats");
    var data = await res.json();
    if (!res.ok) throw new Error(data.error);

    var cards = [
      { label: "Total Users", value: data.totalUsers },
      { label: "Active Users", value: data.activeUsers },
      { label: "New This Week", value: data.newUsersThisWeek },
      { label: "Total Interviews", value: data.totalInterviews },
      { label: "Completed", value: data.completedInterviews },
      { label: "Avg Score", value: data.avgInterviewScore + "%" },
      { label: "Questions", value: data.totalQuestions },
      { label: "Practice Sessions", value: data.totalPracticeSessions },
      { label: "Resumes Built", value: data.totalResumes },
    ];

    statsEl.innerHTML = cards.map(function(c) {
      return "<div class=\"admin-stat-card\"><div class=\"admin-stat-num\">" + c.value + "</div><div class=\"admin-stat-label\">" + c.label + "</div></div>";
    }).join("");

    var signups = data.signupsLast30 || [];
    if (!signups.length) {
      chartEl.innerHTML = "<div class=\"empty-state\">No signups in the last 30 days.</div>";
      return;
    }

    var max = Math.max.apply(null, signups.map(function(d) { return d.count; }).concat([1]));

    chartEl.innerHTML = signups.map(function(d) {
      var pct = Math.round((d.count / max) * 100);
      var label = d._id.slice(5);
      return "<div class=\"bar-col\"><div class=\"bar-fill\" style=\"height:" + pct + "%\" title=\"" + d.count + " signups on " + escHtml4(d._id) + "\"></div><div class=\"bar-label\">" + escHtml4(label) + "</div></div>";
    }).join("");

  } catch (err) {
    statsEl.innerHTML = "<div class=\"empty-state\">Failed to load platform analytics.</div>";
    chartEl.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", function() {
  var user = getSession();
  if (user && user.isAdmin) {
    document.getElementById("userAnalyticsView").style.display = "none";
    document.getElementById("adminAnalyticsView").style.display = "block";
    document.getElementById("periodSelect")?.closest(".page-header")?.remove();
    loadAdminAnalytics();
  }
});


/* ---------- ADMIN: USER PICKER FOR INDIVIDUAL ANALYTICS ---------- */
async function searchUsersForAnalytics(query) {
  const resultsEl = document.getElementById("userPickerResults");
  const bodyEl = document.getElementById("userPickerBody");
  if (!query) { resultsEl.style.display = "none"; return; }

  try {
    const res = await authFetch(`${API}/api/admin/users?search=${encodeURIComponent(query)}&limit=10`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.users || !data.users.length) {
      bodyEl.innerHTML = "<tr><td colspan=\"3\" class=\"empty-state\">No users found.</td></tr>";
      resultsEl.style.display = "block";
      return;
    }

    bodyEl.innerHTML = data.users.map(u =>
      "<tr><td>" + escHtml4(u.firstName + " " + u.lastName) + "</td><td>" + escHtml4(u.email) + "</td>" +
      "<td><button class=\"admin-action-btn\" data-id=\"" + u._id + "\" data-name=\"" + escHtml4(u.firstName + " " + u.lastName) + "\">View Analytics</button></td></tr>"
    ).join("");
    resultsEl.style.display = "block";

    bodyEl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => showUserAnalytics(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    showToast("Search failed: " + (err.message || "Unknown error"), "error");
  }
}

async function showUserAnalytics(userId, userName) {
  const container = document.getElementById("userAnalyticsAdminView");
  const userView = document.getElementById("userAnalyticsView");

  container.innerHTML = "";
  container.appendChild(userView);
  userView.style.display = "block";
  container.style.display = "block";

  const titleEl = userView.querySelector(".page-title");
  const subEl = userView.querySelector(".page-sub");
  if (titleEl) titleEl.textContent = userName + "'s Analytics";
  if (subEl) subEl.textContent = "Viewing as admin.";

  const periodSelect = document.getElementById("periodSelect");
  const period = periodSelect ? periodSelect.value : "30";

  document.getElementById("userPickerResults").style.display = "none";

  await loadAnalytics(period, userId);

  if (periodSelect && !periodSelect.dataset.wired) {
    periodSelect.dataset.wired = "1";
    periodSelect.addEventListener("change", () => loadAnalytics(periodSelect.value, userId));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getSession();
  if (user && user.isAdmin) {
    document.getElementById("userPickerBtn")?.addEventListener("click", () => {
      const q = document.getElementById("userPickerInput").value.trim();
      searchUsersForAnalytics(q);
    });
    document.getElementById("userPickerInput")?.addEventListener("keydown", e => {
      if (e.key === "Enter") searchUsersForAnalytics(e.target.value.trim());
    });
  }
});



/* ---------- DOWNLOAD PDF REPORT ---------- */
function periodLabel(period) {
  if (period === "7") return "Last 7 Days";
  if (period === "90") return "Last 90 Days";
  return "Last 30 Days";
}

function generatePdfReport() {
  const data = window._latestAnalyticsData;
  if (!data) { showToast("Analytics not loaded yet.", "error"); return; }
  const user = getSession();
  const periodSelect = document.getElementById("periodSelect");
  const period = periodSelect ? periodSelect.value : "30";
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const accent = [91, 106, 245];
  let y = 0;

  function addFooter(pageNum) {
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.text("PrepIQ", marginX, pageHeight - 10);
    doc.text("Page " + pageNum, pageWidth - marginX, pageHeight - 10, { align: "right" });
  }

  function checkPageBreak(needed) {
    if (y + needed > pageHeight - 20) {
      addFooter(doc.internal.getNumberOfPages());
      doc.addPage();
      y = 24;
      return true;
    }
    return false;
  }

  function sectionTitle(title) {
    checkPageBreak(20);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(title, marginX, y);
    y += 4;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, marginX + 28, y);
    doc.setFont(undefined, "normal");
    y += 9;
  }

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("PrepIQ Progress Report", marginX, 18);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  const userName = user ? (user.firstName + " " + user.lastName) : "User";
  doc.text(userName + (user && user.email ? "  -  " + user.email : ""), marginX, 27);
  doc.text(periodLabel(period) + "   |   Generated " + new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), marginX, 33);
  y = 50;

  sectionTitle("Performance Summary");
  const s = data.summary || {};
  const summaryRows = [
    ["Total Practice Sessions", String(s.totalSessions || 0)],
    ["Questions Solved", String(s.totalQuestions || 0)],
    ["Average Score", (s.avgScore || 0) + "%"],
    ["Study Hours", (s.studyHours || 0) + " hrs"],
    ["AI Interviews Completed", String(s.interviewsDone || 0)],
    ["Average Interview Score", (s.avgInterviewScore || 0) + "%"],
  ];
  const colWidth = (pageWidth - marginX * 2) / 2;
  summaryRows.forEach(function(row, i) {
    const col = i % 2;
    const rowY = y + Math.floor(i / 2) * 16;
    const x = marginX + col * colWidth;
    doc.setFillColor(247, 247, 252);
    doc.roundedRect(x, rowY - 6, colWidth - 6, 14, 2, 2, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 130);
    doc.text(row[0], x + 5, rowY - 1);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(row[1], x + 5, rowY + 5.5);
    doc.setFont(undefined, "normal");
  });
  y += Math.ceil(summaryRows.length / 2) * 16 + 12;

  checkPageBreak(30);
  sectionTitle("Topic Accuracy");
  const topics = data.topicAccuracy || [];
  if (!topics.length) {
    doc.setFontSize(9.5);
    doc.setTextColor(150, 150, 150);
    doc.text("No topic data available for this period.", marginX, y);
    y += 10;
  } else {
    topics.forEach(function(t) {
      checkPageBreak(12);
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      doc.text(t.category, marginX, y);
      doc.setTextColor(140, 140, 140);
      doc.text(t.sessions + " sessions", marginX + 70, y);
      const barX = marginX + 105;
      const barW = pageWidth - marginX - barX - 16;
      doc.setFillColor(235, 235, 240);
      doc.roundedRect(barX, y - 4, barW, 4, 1, 1, "F");
      const fc = t.accuracy >= 70 ? [34,197,94] : t.accuracy >= 45 ? [240,160,32] : [239,68,68];
      doc.setFillColor(fc[0], fc[1], fc[2]);
      doc.roundedRect(barX, y - 4, barW * Math.min(t.accuracy,100) / 100, 4, 1, 1, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont(undefined, "bold");
      doc.text(t.accuracy + "%", pageWidth - marginX - 12, y, { align: "right" });
      doc.setFont(undefined, "normal");
      y += 11;
    });
    y += 4;
  }

  checkPageBreak(28);
  sectionTitle("Strengths & Areas to Improve");
  const strong = (data.strongTopics || []).map(function(t) { return t.category; });
  const weak = (data.weakTopics || []).map(function(t) { return t.category; });
  doc.setFontSize(9.5);
  doc.setTextColor(34, 150, 80);
  doc.setFont(undefined, "bold");
  doc.text("Strong Topics", marginX, y);
  doc.setFont(undefined, "normal");
  doc.setTextColor(70, 70, 70);
  doc.text(strong.length ? strong.join(", ") : "Keep practicing to identify strengths", marginX, y + 6, { maxWidth: pageWidth - marginX * 2 });
  y += 16;
  checkPageBreak(20);
  doc.setFontSize(9.5);
  doc.setTextColor(200, 60, 60);
  doc.setFont(undefined, "bold");
  doc.text("Needs Improvement", marginX, y);
  doc.setFont(undefined, "normal");
  doc.setTextColor(70, 70, 70);
  doc.text(weak.length ? weak.join(", ") : "No weak areas identified yet", marginX, y + 6, { maxWidth: pageWidth - marginX * 2 });
  y += 18;

  checkPageBreak(28);
  sectionTitle("Recent AI Interviews");
  const interviews = data.interviewHistory || [];
  if (!interviews.length) {
    doc.setFontSize(9.5);
    doc.setTextColor(150, 150, 150);
    doc.text("No interviews completed in this period.", marginX, y);
    y += 10;
  } else {
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text("TYPE", marginX, y);
    doc.text("SCORE", marginX + 90, y);
    doc.text("DATE", marginX + 130, y);
    y += 5;
    doc.setDrawColor(230, 230, 235);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 7;
    interviews.slice(0, 12).forEach(function(iv) {
      checkPageBreak(10);
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      doc.text(iv.type + " Interview", marginX, y);
      doc.setFont(undefined, "bold");
      doc.text(iv.score + "%", marginX + 90, y);
      doc.setFont(undefined, "normal");
      doc.setTextColor(140, 140, 140);
      doc.text(new Date(iv.date).toLocaleDateString(), marginX + 130, y);
      y += 8;
    });
  }

  addFooter(doc.internal.getNumberOfPages());
  const fileName = "PrepIQ_Report_" + (user ? user.firstName : "User") + "_" + periodLabel(period).replace(/\s+/g, "") + "_" + new Date().toISOString().slice(0,10) + ".pdf";
  doc.save(fileName);
  showToast("Report downloaded!");
}

document.getElementById("downloadReportBtn")?.addEventListener("click", generatePdfReport);
