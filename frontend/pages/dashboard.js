/* ====================================================
   dashboard.js — Dashboard page logic
   ==================================================== */


async function loadDashboard() {
  const user = getSession();
  if (!user) return;

  if (user.isAdmin) {
    document.getElementById('userDashboardView').style.display = 'none';
    document.getElementById('adminDashboardView').style.display = 'block';
    document.getElementById('welcomeMsg').textContent = 'Admin Panel';
    document.getElementById('welcomeSub').textContent = 'Platform overview and management.';
    if (typeof loadAdminStats === 'function') loadAdminStats();
    if (typeof loadAdminUsers === 'function') loadAdminUsers();
    return;
  }

  // Set welcome message
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('welcomeMsg').textContent = `${greeting}, ${user.firstName}! 👋`;
  document.getElementById('welcomeSub').textContent = `Level ${user.level || 1} • ${user.xp || 0} XP • Keep pushing!`;

  try {
    const res  = await authFetch(`${API}/api/dashboard`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    renderStats(data.stats);
    renderWeeklyChart(data.weeklyProgress);
    renderActivity(data.recentActivity);
    renderTopicAccuracy(data.topicAccuracy);
    renderBadges(data.achievements);
    renderStreakCalendar(data.streakHistory, data.stats.streak);
  } catch (err) {
    showToast('Failed to load dashboard: ' + (err.message || 'Unknown error'), 'error');
    // Fallback: render from session
    renderStats({
      practiceCount: user.practiceCount || 0,
      streak: user.streak || 0,
      longestStreak: user.longestStreak || 0,
      score: user.score || 0,
      xp: user.xp || 0,
      level: user.level || 1,
      interviewsDone: 0,
      avgInterviewScore: 0,
      atsScore: 0,
      achievementCount: 0,
    });
  }

  // Remove loading state
  document.querySelectorAll('.stat-tile.loading').forEach(t => t.classList.remove('loading'));
}

function renderStats(s) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-sessions',   s.practiceCount);
  set('stat-streak',     `${s.streak}🔥`);
  set('stat-interviews', s.interviewsDone);
  set('stat-score',      s.avgInterviewScore ? `${s.avgInterviewScore}%` : '—');
  set('stat-xp',         s.xp);
  set('stat-level',      `Lv ${s.level}`);
  set('stat-ats',        s.atsScore ? `${s.atsScore}/100` : '—');
  set('stat-badges',     s.achievementCount);
}

function renderWeeklyChart(weeklyProgress) {
  const container = document.getElementById('weeklyChart');
  if (!container || !weeklyProgress?.length) return;

  const max    = Math.max(...weeklyProgress.map(d => d.count), 1);
  const total  = weeklyProgress.reduce((s, d) => s + d.count, 0);
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  document.getElementById('weekTotal').textContent = `${total} sessions this week`;

  container.innerHTML = weeklyProgress.map(d => {
    const pct  = Math.round((d.count / max) * 100);
    const day  = days[new Date(d.date).getDay()];
    const isToday = d.date === new Date().toISOString().slice(0, 10);
    return `
      <div class="bar-col">
        <div class="bar-val">${d.count || ''}</div>
        <div class="bar-wrap">
          <div class="bar-fill ${isToday ? 'today' : ''}" style="height:${Math.max(pct, d.count ? 4 : 0)}%"></div>
        </div>
        <div class="bar-label ${isToday ? 'today' : ''}">${day}</div>
      </div>`;
  }).join('');
}

function renderActivity(activities) {
  const el = document.getElementById('activityList');
  if (!activities?.length) { el.innerHTML = '<div class="empty-state">No sessions yet. Start practicing!</div>'; return; }

  const icons = { quiz:'📚', aptitude:'🧮', coding:'💻', interview:'🤖', resume:'📄' };
  el.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="act-icon">${icons[a.type] || '📝'}</div>
      <div class="act-body">
        <div class="act-title">${escHtml(a.category)}</div>
        <div class="act-meta">${a.type} • Score: ${a.score ?? '—'}${a.totalQ ? ` • ${a.totalQ}Q` : ''}</div>
      </div>
      <div class="act-right">
        <div class="act-xp">+${a.xpEarned || 0} XP</div>
        <div class="act-date">${fmtDate(a.date)}</div>
      </div>
    </div>`).join('');
}

function renderTopicAccuracy(topics) {
  const el = document.getElementById('topicList');
  if (!topics?.length) { el.innerHTML = '<div class="empty-state">Complete quizzes to see accuracy.</div>'; return; }

  el.innerHTML = topics.slice(0, 8).map(t => {
    const color = t.accuracy >= 70 ? 'var(--green)' : t.accuracy >= 45 ? 'var(--gold)' : 'var(--red)';
    return `
      <div class="topic-row">
        <div class="topic-name">${escHtml(t.category)}</div>
        <div class="topic-bar-wrap">
          <div class="topic-bar-fill" style="width:${t.accuracy}%;background:${color}"></div>
        </div>
        <div class="topic-pct" style="color:${color}">${t.accuracy}%</div>
      </div>`;
  }).join('');
}

function renderBadges(achievements) {
  const el = document.getElementById('badgeGrid');
  if (!achievements?.length) { el.innerHTML = '<div class="empty-state">Complete tasks to earn badges!</div>'; return; }

  el.innerHTML = achievements.map(a => `
    <div class="badge-item" title="${escHtml(a.description || a.title)}">
      <div class="badge-icon">${a.icon || '🏅'}</div>
      <div class="badge-name">${escHtml(a.title)}</div>
    </div>`).join('');
}

function renderStreakCalendar(history, currentStreak) {
  const el = document.getElementById('streakCalendar');
  if (!el) return;

  document.getElementById('streakInfo').textContent = `${currentStreak} day streak 🔥`;

  const histSet = new Set(history || []);
  const today   = new Date();
  const cells   = [];

  // Last 30 days
  for (let i = 29; i >= 0; i--) {
    const d   = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const practiced = histSet.has(key);
    const isToday   = i === 0;
    cells.push(`<div class="cal-day ${practiced ? 'active' : ''} ${isToday ? 'today' : ''}" title="${key}"></div>`);
  }

  el.innerHTML = `<div class="cal-grid">${cells.join('')}</div>
    <div class="cal-legend"><span class="cal-day"></span> No practice <span class="cal-day active" style="margin-left:12px"></span> Practiced</div>`;
}

document.addEventListener('DOMContentLoaded', loadDashboard);

