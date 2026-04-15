const Friendship = require('../models/Friendship');
const Session = require('../models/Session');
const User = require('../models/User');
const leaderboardService = require('./leaderboardService');
const AppError = require('../utils/AppError');

function getWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
}

function formatSession(session) {
  return {
    id: session._id.toString(),
    subject: session.subject,
    durationMinutes: session.durationMinutes,
    pointsEarned: session.pointsEarned,
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
  };
}

async function getDashboard(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const weekStart = getWeekStart();

  const [
    completedTotals,
    weeklyTotals,
    activeSession,
    recentSessions,
    friendCount,
    rankResult,
  ] = await Promise.all([
    Session.aggregate([
      { $match: { userId: user._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalStudyMinutes: { $sum: '$durationMinutes' },
          totalSessions: { $sum: 1 },
        },
      },
    ]),
    Session.aggregate([
      {
        $match: {
          userId: user._id,
          status: 'completed',
          endTime: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          weeklyStudyMinutes: { $sum: '$durationMinutes' },
          weeklySessions: { $sum: 1 },
        },
      },
    ]),
    Session.findOne({ userId: user._id, status: { $in: ['active', 'paused'] } }).sort({ startTime: -1 }),
    Session.find({ userId: user._id, status: 'completed' }).sort({ endTime: -1 }).limit(5),
    Friendship.countDocuments({
      status: 'accepted',
      $or: [{ requester: user._id }, { recipient: user._id }],
    }),
    leaderboardService.getUserRank(userId, { period: 'allTime' }),
  ]);

  const totals = completedTotals[0] || { totalStudyMinutes: 0, totalSessions: 0 };
  const weekly = weeklyTotals[0] || { weeklyStudyMinutes: 0, weeklySessions: 0 };

  return {
    profile: {
      id: user._id.toString(),
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      memberSince: user.createdAt,
    },
    playerStats: {
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      rank: rankResult.rank,
      friendCount,
    },
    studyStats: {
      totalStudyMinutes: totals.totalStudyMinutes,
      totalSessions: totals.totalSessions,
      weeklyStudyMinutes: weekly.weeklyStudyMinutes,
      weeklySessions: weekly.weeklySessions,
    },
    activeSession: activeSession ? formatSession(activeSession) : null,
    recentSessions: recentSessions.map(formatSession),
  };
}

module.exports = { getDashboard };
