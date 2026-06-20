/* Streak calculation helper */
import { sendEmail, streakEmailHtml } from './email-helper.js';
export function getTodayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function updateStreak(user, Streak) {
  const today     = getTodayStr();
  const yesterday = getYesterdayStr();

  let streakDoc = await Streak.findOne({ user: user._id });
  if (!streakDoc) {
    streakDoc = new Streak({ user: user._id, currentStreak: 0, longestStreak: 0, history: [] });
  }

  // Already counted today
  if (streakDoc.lastDate === today) return streakDoc;

  if (streakDoc.lastDate === yesterday) {
    streakDoc.currentStreak += 1;
  } else if (streakDoc.lastDate !== today) {
    streakDoc.currentStreak = 1; // reset
  }

  streakDoc.longestStreak = Math.max(streakDoc.longestStreak, streakDoc.currentStreak);
  streakDoc.lastDate       = today;

  if (!streakDoc.history.includes(today)) streakDoc.history.push(today);
  // Keep last 365 days
  if (streakDoc.history.length > 365) streakDoc.history = streakDoc.history.slice(-365);

  // Milestone check
  const milestonedays = [7, 30, 100];
  for (const d of milestonedays) {
    if (streakDoc.currentStreak === d &&
        !streakDoc.milestones?.find(m => m.days === d)) {
      streakDoc.milestones = streakDoc.milestones || [];
      streakDoc.milestones.push({ days: d, achievedAt: new Date() });
    }
  }

  // Send milestone email
  const milestonedays2 = [7, 30, 100];
  if (milestonedays2.includes(streakDoc.currentStreak) &&
      streakDoc.milestones?.find(m => m.days === streakDoc.currentStreak) &&
      user.email) {
    sendEmail({
      to: user.email,
      subject: streakDoc.currentStreak + '-day streak on PrepIQ!',
      html: streakEmailHtml(user.firstName, streakDoc.currentStreak),
    });
  }

  await streakDoc.save();

  // Sync to User
  user.streak        = streakDoc.currentStreak;
  user.longestStreak = streakDoc.longestStreak;
  user.lastStreakDate = new Date();
  await user.save();

  return streakDoc;
}

