const User = require('../models/User');
const Session = require('../models/Session');

const getMetrics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, totalSessions, studyTimeResult] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),
      Session.countDocuments({ status: 'completed' }),
      Session.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$durationMinutes' } } },
      ]),
    ]);

    const totalStudyMinutes = studyTimeResult[0]?.total ?? 0;

    res.json({
      success: true,
      data: { totalUsers, activeUsers, totalSessions, totalStudyMinutes },
    });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [dailyActiveData, avgSessionResult, topUsers] = await Promise.all([
      Session.aggregate([
        { $match: { status: 'completed', startTime: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
            },
            uniqueUsers: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            date: '$_id',
            activeUsers: { $size: '$uniqueUsers' },
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ]),
      Session.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$durationMinutes' } } },
      ]),
      User.find()
        .sort({ totalPoints: -1 })
        .limit(5)
        .select('displayName totalPoints currentStreak'),
    ]);

    // fill in any missing days in the last 7 with 0
    const dailyMap = Object.fromEntries(dailyActiveData.map((d) => [d.date, d.activeUsers]));
    const dailyActiveUsers = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyActiveUsers.push({ date: key, activeUsers: dailyMap[key] ?? 0 });
    }

    const avgSessionLength = Math.round(avgSessionResult[0]?.avg ?? 0);

    res.json({
      success: true,
      data: { dailyActiveUsers, avgSessionLength, topUsers },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMetrics, getAnalytics };
