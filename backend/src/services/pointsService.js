// points service — tiered xp calc with streak multiplier and completion bonus (US-10)

const SESSION_CAP = 240;
const MIN_SESSION = 5;
const COMPLETION_BONUS = 50;

const TIERS = [
  { upTo: 30, rate: 10 },
  { upTo: 60, rate: 15 },
  { upTo: Infinity, rate: 20 },
];

const STREAK_MULTIPLIERS = [
  { minDays: 30, multiplier: 1.75 },
  { minDays: 7, multiplier: 1.35 },
  { minDays: 3, multiplier: 1.15 },
];

function getStreakMultiplier(currentStreak) {
  for (const tier of STREAK_MULTIPLIERS) {
    if (currentStreak >= tier.minDays) return tier.multiplier;
  }
  return 1.0;
}

function calculateBaseXP(minutes) {
  const capped = Math.min(minutes, SESSION_CAP);
  let xp = 0;
  let remaining = capped;
  let prevCap = 0;

  for (const tier of TIERS) {
    const tierMinutes = Math.min(remaining, tier.upTo - prevCap);
    if (tierMinutes <= 0) break;
    xp += tierMinutes * tier.rate;
    remaining -= tierMinutes;
    prevCap = tier.upTo;
  }

  return xp;
}

function calculatePoints(durationMinutes, currentStreak) {
  if (durationMinutes < MIN_SESSION) return 0;
  const baseXP = calculateBaseXP(durationMinutes);
  const multiplier = getStreakMultiplier(currentStreak);
  return Math.floor(baseXP * multiplier) + COMPLETION_BONUS;
}

module.exports = {
  calculatePoints,
  calculateBaseXP,
  getStreakMultiplier,
  SESSION_CAP,
  MIN_SESSION,
  COMPLETION_BONUS,
};
