// leaderboard controller — delegates to leaderboardService (US-9)

const leaderboardService = require('../services/leaderboardService');

const getLeaderboard = async (req, res, next) => {
  try {
    const result = await leaderboardService.getLeaderboard({
      period: req.query.period,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getFriendsLeaderboard = async (req, res, next) => {
  try {
    const result = await leaderboardService.getFriendsLeaderboard(req.user.id, {
      period: req.query.period,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getUserRank = async (req, res, next) => {
  try {
    const result = await leaderboardService.getUserRank(req.user.id, {
      period: req.query.period,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard, getFriendsLeaderboard, getUserRank };
