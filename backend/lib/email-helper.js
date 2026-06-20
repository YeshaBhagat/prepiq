import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("[email] Gmail credentials not set, skipping email to", to);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: "PrepIQ <" + process.env.GMAIL_USER + ">",
      to: to,
      subject: subject,
      html: html,
    });
    console.log("[email] sent to", to, info.messageId);
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

export function badgeEmailHtml(firstName, badges) {
  var items = badges.map(function(b) {
    return "<div style=\"display:flex;align-items:center;gap:12px;padding:12px;background:#f4f4f8;border-radius:10px;margin-bottom:8px\">"
      + "<div style=\"font-size:28px\">" + (b.icon || "🏆") + "</div>"
      + "<div><strong>" + b.title + "</strong><br/><span style=\"color:#888;font-size:13px\">" + b.description + " (+" + b.xp + " XP)</span></div>"
      + "</div>";
  }).join("");

  return "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:0 auto\">"
    + "<h2 style=\"color:#5b6af5\">🎉 New Badge" + (badges.length > 1 ? "s" : "") + " Unlocked!</h2>"
    + "<p>Hi " + firstName + ",</p>"
    + "<p>Great work! You just earned " + (badges.length > 1 ? "new badges" : "a new badge") + ":</p>"
    + items
    + "<a href=\"http://127.0.0.1:8124/pages/achievements.html\" style=\"display:inline-block;background:#5b6af5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px\">View Achievements</a>"
    + "</div>";
}

export function streakEmailHtml(firstName, days) {
  return "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:0 auto\">"
    + "<h2 style=\"color:#f0a020\">🔥 " + days + "-Day Streak!</h2>"
    + "<p>Hi " + firstName + ",</p>"
    + "<p>You have practiced for " + days + " days in a row. Keep up the momentum!</p>"
    + "<a href=\"http://127.0.0.1:8124/pages/dashboard.html\" style=\"display:inline-block;background:#f0a020;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px\">Go to Dashboard</a>"
    + "</div>";
}

export function resetPasswordEmailHtml(firstName, resetUrl) {
  return "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:0 auto\">"
    + "<h2 style=\"color:#5b6af5\">PrepIQ Password Reset</h2>"
    + "<p>Hi " + firstName + ",</p>"
    + "<p>We received a request to reset your password. Click the button below. This link expires in 1 hour.</p>"
    + "<a href=\"" + resetUrl + "\" style=\"display:inline-block;background:#5b6af5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0\">Reset Password</a>"
    + "<p style=\"color:#888;font-size:13px\">If you did not request this, you can safely ignore this email.</p>"
    + "</div>";
}
