import { sendEmail, badgeEmailHtml } from "./email-helper.js";
/* XP & Level System */
export const XP_REWARDS = {
  quiz_correct:      10,
  aptitude_correct:  10,
  coding_submit:     25,
  interview_complete:50,
  resume_analyze:    15,
  daily_login:        5,
  streak_7:          50,
  streak_30:        200,
};

export function calcLevel(xp) {
  // Level formula: level = floor(sqrt(xp/100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForNextLevel(level) {
  return level * level * 100;
}

export const BADGES = {
  FIRST_PRACTICE:   { badge:'first_practice',   title:'First Step',      description:'Completed your first practice session', icon:'🎯', xp:20 },
  STREAK_3:         { badge:'streak_3',          title:'On Fire',         description:'3-day practice streak',                  icon:'🔥', xp:30 },
  STREAK_7:         { badge:'streak_7',          title:'Week Warrior',    description:'7-day practice streak',                  icon:'⚡', xp:50 },
  STREAK_30:        { badge:'streak_30',         title:'Unstoppable',     description:'30-day practice streak',                 icon:'🏆', xp:200 },
  SCORE_100:        { badge:'score_100',         title:'Centurion',       description:'Scored 100+ total points',               icon:'💯', xp:25 },
  INTERVIEW_FIRST:  { badge:'interview_first',   title:'Interviewed',     description:'Completed first AI interview',           icon:'🤖', xp:40 },
  RESUME_ANALYZED:  { badge:'resume_analyzed',   title:'Resume Ready',    description:'Analyzed your resume',                   icon:'📄', xp:20 },
  QUESTIONS_10:     { badge:'questions_10',      title:'Problem Solver',  description:'Solved 10 questions',                    icon:'🧩', xp:30 },
  QUESTIONS_50:     { badge:'questions_50',      title:'Practice Pro',    description:'Solved 50 questions',                    icon:'⭐', xp:100 },
  LEVEL_5:          { badge:'level_5',           title:'Level 5 Reached', description:'Reached Level 5',                       icon:'🚀', xp:75 },
};

export async function checkAndAwardBadges(user, Achievement) {
  const existing = await Achievement.find({ user: user._id }).select('badge');
  const earned   = new Set(existing.map(a => a.badge));
  const toAward  = [];

  if (!earned.has('first_practice') && user.practiceCount >= 1)   toAward.push(BADGES.FIRST_PRACTICE);
  if (!earned.has('streak_3')       && user.streak >= 3)          toAward.push(BADGES.STREAK_3);
  if (!earned.has('streak_7')       && user.streak >= 7)          toAward.push(BADGES.STREAK_7);
  if (!earned.has('streak_30')      && user.streak >= 30)         toAward.push(BADGES.STREAK_30);
  if (!earned.has('score_100')      && user.score >= 100)         toAward.push(BADGES.SCORE_100);
  if (!earned.has('questions_10')   && user.practiceCount >= 10)  toAward.push(BADGES.QUESTIONS_10);
  if (!earned.has('questions_50')   && user.practiceCount >= 50)  toAward.push(BADGES.QUESTIONS_50);
  if (!earned.has('level_5')        && user.level >= 5)           toAward.push(BADGES.LEVEL_5);

  for (const badge of toAward) {
    await Achievement.create({ user: user._id, ...badge });
    user.xp += badge.xp;
  }

  if (toAward.length > 0) {
    user.level = calcLevel(user.xp);
    await user.save();

    if (user.email) {
      sendEmail({
        to: user.email,
        subject: toAward.length > 1 ? "You earned new badges on PrepIQ!" : "You earned a new badge on PrepIQ!",
        html: badgeEmailHtml(user.firstName, toAward),
      });
    }
  }

  return toAward;
}

