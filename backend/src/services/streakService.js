// streak service — continue/reset/same-day logic based on calendar days (US-10)

function computeStreakUpdate(lastStudyDate, currentStreak) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastStudyDate) {
    return { currentStreak: 1 };
  }

  const last = new Date(lastStudyDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffMs = today.getTime() - lastDay.getTime();
  // round to handle DST edge cases where midnight-to-midnight can be 23 or 25 hours
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { currentStreak };
  if (diffDays === 1) return { currentStreak: currentStreak + 1 };
  return { currentStreak: 1 };
}

// lazy streak check — resets streak if more than one day has passed without studying
// called on session start so the frontend sees an accurate streak value
function checkStreakExpiry(lastStudyDate, currentStreak) {
  if (!lastStudyDate || currentStreak === 0) return { currentStreak: 0, expired: false };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(lastStudyDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffMs = today.getTime() - lastDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return { currentStreak: 0, expired: true };
  return { currentStreak, expired: false };
}

module.exports = { computeStreakUpdate, checkStreakExpiry };
