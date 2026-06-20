let currentPage = 1;
let currentSearch = "";
let qPage = 1;
let qSearch = "";
let qCategory = "";

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;"
  }[c]));
}

async function loadAdminStats() {
  const el = document.getElementById("adminStats");
  try {
    const res = await authFetch(API + "/api/admin/stats");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const cards = [
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

    el.innerHTML = cards.map(c =>
      "<div class=\"admin-stat-card\"><div class=\"admin-stat-num\">" + c.value + "</div><div class=\"admin-stat-label\">" + c.label + "</div></div>"
    ).join("");
  } catch (err) {
    el.innerHTML = "<div class=\"empty-state\">Failed to load stats.</div>";
  }
}

async function loadAdminUsers() {
  const body = document.getElementById("adminUsersBody");
  const errEl = document.getElementById("adminError");
  errEl.textContent = "";
  body.innerHTML = "<tr><td colspan=\"7\" class=\"empty-state\">Loading users...</td></tr>";

  try {
    const params = new URLSearchParams({ page: currentPage, limit: 20 });
    if (currentSearch) params.set("search", currentSearch);

    const res = await authFetch(API + "/api/admin/users?" + params.toString());
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load users.");

    if (!data.users || !data.users.length) {
      body.innerHTML = "<tr><td colspan=\"7\" class=\"empty-state\">No users found.</td></tr>";
      document.getElementById("adminPagination").innerHTML = "";
      return;
    }

    body.innerHTML = data.users.map(u => {
      return "<tr data-id=\"" + u._id + "\">"
        + "<td>" + escHtml(u.firstName) + " " + escHtml(u.lastName) + "</td>"
        + "<td>" + escHtml(u.email) + "</td>"
        + "<td>" + escHtml(u.college || "-") + "</td>"
        + "<td>" + fmtDate(u.createdAt) + "</td>"
        + "<td><label class=\"admin-toggle\"><input type=\"checkbox\" class=\"admin-active-toggle\" " + (u.isActive ? "checked" : "") + " /><span class=\"admin-toggle-slider\"></span></label></td>"
        + "<td><label class=\"admin-toggle\"><input type=\"checkbox\" class=\"admin-admin-toggle\" " + (u.isAdmin ? "checked" : "") + " /><span class=\"admin-toggle-slider\"></span></label></td>"
        + "<td>"
          + "<button class=\"admin-action-btn view-user-btn\">View</button>"
          + "<button class=\"admin-action-btn danger delete-user-btn\">Delete</button>"
        + "</td>"
        + "</tr>";
    }).join("");

    const pag = document.getElementById("adminPagination");
    if (data.pages > 1) {
      let html = "";
      for (let i = 1; i <= data.pages; i++) {
        html += "<button class=\"admin-page-btn " + (i === currentPage ? "active" : "") + "\" data-page=\"" + i + "\">" + i + "</button>";
      }
      pag.innerHTML = html;
    } else {
      pag.innerHTML = "";
    }

    body.querySelectorAll("tr").forEach(row => {
      const id = row.dataset.id;
      const name = row.children[0].textContent;
      const activeToggle = row.querySelector(".admin-active-toggle");
      const adminToggle = row.querySelector(".admin-admin-toggle");
      if (activeToggle) activeToggle.addEventListener("change", e => updateUser(id, { isActive: e.target.checked }));
      if (adminToggle) adminToggle.addEventListener("change", e => updateUser(id, { isAdmin: e.target.checked }));
      row.querySelector(".view-user-btn")?.addEventListener("click", () => openUserActivity(id));
      row.querySelector(".delete-user-btn")?.addEventListener("click", () => deleteUser(id, name));
    });

    pag.querySelectorAll(".admin-page-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        loadAdminUsers();
      });
    });

  } catch (err) {
    errEl.textContent = err.message || "Failed to load users.";
    body.innerHTML = "<tr><td colspan=\"7\" class=\"empty-state\">Could not load users.</td></tr>";
  }
}

async function updateUser(id, patch) {
  try {
    const res = await authFetch(API + "/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ id: id }, patch)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast("User updated.");
  } catch (err) {
    showToast(err.message || "Update failed.", "error");
    loadAdminUsers();
  }
}

async function deleteUser(id, name) {
  if (!confirm("Delete user \"" + name + "\"? This cannot be undone.")) return;
  try {
    const res = await authFetch(API + "/api/admin/users?id=" + id, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast("User deleted.");
    loadAdminUsers();
    loadAdminStats();
  } catch (err) {
    showToast(err.message || "Delete failed.", "error");
  }
}

async function openUserActivity(id) {
  const modal = document.getElementById("userActivityModal");
  const body = document.getElementById("userActivityBody");
  body.innerHTML = "<div class=\"empty-state\">Loading...</div>";
  modal.style.display = "flex";

  try {
    const res = await authFetch(API + "/api/admin/user-activity?id=" + id);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const u = data.user;
    const initials = ((u.firstName && u.firstName[0]) || "") + ((u.lastName && u.lastName[0]) || "");

    let html = "<div class=\"ua-header\">"
      + "<div class=\"ua-avatar\">" + initials.toUpperCase() + "</div>"
      + "<div><div style=\"font-weight:700\">" + escHtml(u.firstName) + " " + escHtml(u.lastName) + "</div>"
      + "<div style=\"color:var(--muted);font-size:.85rem\">" + escHtml(u.email) + "</div></div>"
      + "</div>";

    html += "<div class=\"ua-stats-row\">"
      + "<div class=\"ua-stat\"><div class=\"ua-stat-num\">" + (u.practiceCount || 0) + "</div><div class=\"ua-stat-label\">Sessions</div></div>"
      + "<div class=\"ua-stat\"><div class=\"ua-stat-num\">" + (u.streak || 0) + "</div><div class=\"ua-stat-label\">Streak</div></div>"
      + "<div class=\"ua-stat\"><div class=\"ua-stat-num\">" + (u.xp || 0) + "</div><div class=\"ua-stat-label\">XP</div></div>"
      + "<div class=\"ua-stat\"><div class=\"ua-stat-num\">Lv" + (u.level || 1) + "</div><div class=\"ua-stat-label\">Level</div></div>"
      + "<div class=\"ua-stat\"><div class=\"ua-stat-num\">" + ((data.achievements && data.achievements.length) || 0) + "</div><div class=\"ua-stat-label\">Badges</div></div>"
      + "<div class=\"ua-stat\"><div class=\"ua-stat-num\">" + ((data.resume && data.resume.atsScore) || 0) + "</div><div class=\"ua-stat-label\">ATS Score</div></div>"
      + "</div>";

    html += "<div class=\"ua-section-title\">Recent Interviews</div>";
    if (data.interviews && data.interviews.length) {
      html += data.interviews.map(iv =>
        "<div class=\"ua-list-item\"><span>" + escHtml(iv.type) + " - " + fmtDate(iv.createdAt) + "</span><span>" + (iv.status === "completed" ? iv.overallScore + "%" : "In Progress") + "</span></div>"
      ).join("");
    } else {
      html += "<div class=\"empty-state\">No interviews yet.</div>";
    }

    html += "<div class=\"ua-section-title\">Recent Practice History</div>";
    if (data.practiceHistory && data.practiceHistory.length) {
      html += data.practiceHistory.slice(0, 8).map(p =>
        "<div class=\"ua-list-item\"><span>" + escHtml(p.category || p.topic || "Practice") + " - " + fmtDate(p.createdAt) + "</span><span>" + (p.score || 0) + "%</span></div>"
      ).join("");
    } else {
      html += "<div class=\"empty-state\">No practice history yet.</div>";
    }

    body.innerHTML = html;
  } catch (err) {
    body.innerHTML = "<div class=\"empty-state\">Failed to load user activity.</div>";
  }
}

async function loadAdminQuestions() {
  const body = document.getElementById("qBody");
  const errEl = document.getElementById("qError");
  errEl.textContent = "";
  body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">Loading...</td></tr>";

  try {
    const params = new URLSearchParams({ page: qPage, limit: 20 });
    if (qSearch) params.set("search", qSearch);
    if (qCategory) params.set("category", qCategory);

    const res = await authFetch(API + "/api/admin/questions?" + params.toString());
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.questions || !data.questions.length) {
      body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">No questions found.</td></tr>";
      document.getElementById("qPagination").innerHTML = "";
      return;
    }

    body.innerHTML = data.questions.map(q => {
      return "<tr data-id=\"" + q._id + "\">"
        + "<td>" + escHtml(q.title) + "</td>"
        + "<td>" + escHtml(q.category) + "</td>"
        + "<td>" + escHtml(q.difficulty) + "</td>"
        + "<td>" + escHtml(q.type) + "</td>"
        + "<td><label class=\"admin-toggle\"><input type=\"checkbox\" class=\"q-active-toggle\" " + (q.isActive ? "checked" : "") + " /><span class=\"admin-toggle-slider\"></span></label></td>"
        + "<td>"
          + "<button class=\"admin-action-btn edit-q-btn\">Edit</button>"
          + "<button class=\"admin-action-btn danger delete-q-btn\">Delete</button>"
        + "</td>"
        + "</tr>";
    }).join("");

    const pag = document.getElementById("qPagination");
    if (data.pages > 1) {
      let html = "";
      for (let i = 1; i <= data.pages; i++) {
        html += "<button class=\"admin-page-btn " + (i === qPage ? "active" : "") + "\" data-page=\"" + i + "\">" + i + "</button>";
      }
      pag.innerHTML = html;
    } else {
      pag.innerHTML = "";
    }

    body.querySelectorAll("tr").forEach(row => {
      const id = row.dataset.id;
      const question = data.questions.find(x => x._id === id);
      const activeToggle = row.querySelector(".q-active-toggle");
      if (activeToggle) activeToggle.addEventListener("change", e => updateQuestion(id, { isActive: e.target.checked }));
      row.querySelector(".edit-q-btn")?.addEventListener("click", () => openQuestionModal(question));
      row.querySelector(".delete-q-btn")?.addEventListener("click", () => deleteQuestion(id, question.title));
    });

    pag.querySelectorAll(".admin-page-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        qPage = Number(btn.dataset.page);
        loadAdminQuestions();
      });
    });

  } catch (err) {
    errEl.textContent = err.message || "Failed to load questions.";
    body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">Could not load questions.</td></tr>";
  }
}

async function updateQuestion(id, patch) {
  try {
    const res = await authFetch(API + "/api/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ id: id }, patch)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast("Question updated.");
  } catch (err) {
    showToast(err.message || "Update failed.", "error");
    loadAdminQuestions();
  }
}

async function deleteQuestion(id, title) {
  if (!confirm("Delete question \"" + title + "\"?")) return;
  try {
    const res = await authFetch(API + "/api/admin/questions?id=" + id, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast("Question deleted.");
    loadAdminQuestions();
    loadAdminStats();
  } catch (err) {
    showToast(err.message || "Delete failed.", "error");
  }
}

function openQuestionModal(question) {
  const modal = document.getElementById("questionModal");
  const title = document.getElementById("questionModalTitle");
  document.getElementById("qFormError").textContent = "";

  if (question) {
    title.textContent = "Edit Question";
    document.getElementById("qId").value = question._id;
    document.getElementById("qTitle").value = question.title || "";
    document.getElementById("qDescription").value = question.description || "";
    document.getElementById("qCategory").value = question.category || "DSA";
    document.getElementById("qDifficulty").value = question.difficulty || "Medium";
    document.getElementById("qType").value = question.type || "mcq";
    document.getElementById("qOptions").value = (question.options || []).join("\n");
    document.getElementById("qAnswer").value = (question.answer === undefined || question.answer === null) ? "" : question.answer;
    document.getElementById("qExplanation").value = question.explanation || "";
  } else {
    title.textContent = "Add Question";
    document.getElementById("qId").value = "";
    document.getElementById("qTitle").value = "";
    document.getElementById("qDescription").value = "";
    document.getElementById("qCategory").value = "DSA";
    document.getElementById("qDifficulty").value = "Medium";
    document.getElementById("qType").value = "mcq";
    document.getElementById("qOptions").value = "";
    document.getElementById("qAnswer").value = "";
    document.getElementById("qExplanation").value = "";
  }

  modal.style.display = "flex";
}

async function saveQuestion() {
  const errEl = document.getElementById("qFormError");
  errEl.textContent = "";

  const id = document.getElementById("qId").value;
  const title = document.getElementById("qTitle").value.trim();
  const description = document.getElementById("qDescription").value.trim();
  const category = document.getElementById("qCategory").value;
  const difficulty = document.getElementById("qDifficulty").value;
  const type = document.getElementById("qType").value;
  const optionsRaw = document.getElementById("qOptions").value.trim();
  const options = optionsRaw ? optionsRaw.split("\n").map(s => s.trim()).filter(Boolean) : [];
  const answerRaw = document.getElementById("qAnswer").value;
  const answer = answerRaw !== "" ? Number(answerRaw) : undefined;
  const explanation = document.getElementById("qExplanation").value.trim();

  if (!title || !description) {
    errEl.textContent = "Title and description are required.";
    return;
  }

  const payload = { title: title, description: description, category: category, difficulty: difficulty, type: type, options: options, answer: answer, explanation: explanation };

  try {
    let res;
    if (id) {
      res = await authFetch(API + "/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ id: id }, payload)),
      });
    } else {
      res = await authFetch(API + "/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(id ? "Question updated." : "Question created.");
    document.getElementById("questionModal").style.display = "none";
    loadAdminQuestions();
    loadAdminStats();
  } catch (err) {
    errEl.textContent = err.message || "Save failed.";
  }
}

function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.getElementById("adminUsersTab").style.display = tab === "users" ? "block" : "none";
  document.getElementById("adminQuestionsTab").style.display = tab === "questions" ? "block" : "none";
  if (tab === "questions") loadAdminQuestions();
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdminStats();
  loadAdminUsers();

  document.getElementById("adminSearchBtn")?.addEventListener("click", () => {
    currentSearch = document.getElementById("adminSearch").value.trim();
    currentPage = 1;
    loadAdminUsers();
  });

  document.getElementById("adminSearch")?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      currentSearch = e.target.value.trim();
      currentPage = 1;
      loadAdminUsers();
    }
  });

  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("closeUserModal")?.addEventListener("click", () => {
    document.getElementById("userActivityModal").style.display = "none";
  });
  document.getElementById("userActivityModal")?.addEventListener("click", e => {
    if (e.target.id === "userActivityModal") e.target.style.display = "none";
  });

  document.getElementById("closeQuestionModal")?.addEventListener("click", () => {
    document.getElementById("questionModal").style.display = "none";
  });
  document.getElementById("questionModal")?.addEventListener("click", e => {
    if (e.target.id === "questionModal") e.target.style.display = "none";
  });

  document.getElementById("qAddBtn")?.addEventListener("click", () => openQuestionModal(null));
  document.getElementById("qSaveBtn")?.addEventListener("click", saveQuestion);

  document.getElementById("qSearchBtn")?.addEventListener("click", () => {
    qSearch = document.getElementById("qSearch").value.trim();
    qCategory = document.getElementById("qCategoryFilter").value;
    qPage = 1;
    loadAdminQuestions();
  });

  document.getElementById("qSearch")?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      qSearch = e.target.value.trim();
      qCategory = document.getElementById("qCategoryFilter").value;
      qPage = 1;
      loadAdminQuestions();
    }
  });
});
