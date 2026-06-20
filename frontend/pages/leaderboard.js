function escHtmlLb(str) {
  return String(str || "").replace(/[&<>"']/g, function(c) {
    var map = { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" };
    return map[c];
  });
}

function medalFor(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "#" + rank;
}

async function loadLeaderboard() {
  var body = document.getElementById("lbBody");
  var errEl = document.getElementById("lbError");
  var myRankEl = document.getElementById("myRankCard");
  errEl.textContent = "";

  try {
    var res = await authFetch(API + "/api/leaderboard?limit=50");
    var data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (data.myRank) {
      var m = data.myRank;
      var initials = ((m.firstName && m.firstName[0]) || "") + ((m.lastName && m.lastName[0]) || "");
      myRankEl.innerHTML = "<div class=\"lb-myrank-inner\">"
        + "<div class=\"lb-myrank-rank\">" + medalFor(m.rank) + "</div>"
        + "<div class=\"ua-avatar\">" + initials.toUpperCase() + "</div>"
        + "<div class=\"lb-myrank-info\"><div style=\"font-weight:700\">" + escHtmlLb(m.firstName + " " + m.lastName) + " (You)</div>"
        + "<div style=\"color:var(--muted);font-size:.85rem\">Level " + m.level + " &middot; " + m.xp + " XP &middot; " + m.streak + " day streak</div></div>"
        + "</div>";
    }

    if (!data.leaderboard || !data.leaderboard.length) {
      body.innerHTML = "<tr><td colspan=\"7\" class=\"empty-state\">No users yet.</td></tr>";
      return;
    }

    body.innerHTML = data.leaderboard.map(function(u) {
      var initials = ((u.firstName && u.firstName[0]) || "") + ((u.lastName && u.lastName[0]) || "");
      var rowClass = u.isCurrentUser ? "lb-row-me" : "";
      return "<tr class=\"" + rowClass + "\">"
        + "<td class=\"lb-rank\">" + medalFor(u.rank) + "</td>"
        + "<td><div style=\"display:flex;align-items:center;gap:8px\"><div class=\"ua-avatar\" style=\"width:28px;height:28px;font-size:.7rem\">" + initials.toUpperCase() + "</div>" + escHtmlLb(u.firstName + " " + u.lastName) + (u.isCurrentUser ? " (You)" : "") + "</div></td>"
        + "<td>" + escHtmlLb(u.college || "-") + "</td>"
        + "<td>Lv" + u.level + "</td>"
        + "<td>" + u.xp + "</td>"
        + "<td>" + u.streak + " 🔥</td>"
        + "<td>" + u.practiceCount + "</td>"
        + "</tr>";
    }).join("");

  } catch (err) {
    errEl.textContent = err.message || "Failed to load leaderboard.";
    body.innerHTML = "<tr><td colspan=\"7\" class=\"empty-state\">Could not load leaderboard.</td></tr>";
  }
}

document.addEventListener("DOMContentLoaded", loadLeaderboard);
