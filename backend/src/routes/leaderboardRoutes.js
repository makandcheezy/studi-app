// leaderboard endpoints — global, friends-only, and personal rank (US-9)
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const leaderboardController = require('../controllers/leaderboardController');

// router.use(protect); // TODO: re-enable after auth is wired up

const periodCheck = query('period')
  .optional()
  .isIn(['daily', 'weekly', 'monthly', 'allTime'])
  .withMessage('Period must be daily, weekly, monthly, or allTime');

const paginationChecks = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

router.get(
  '/',
  periodCheck,
  ...paginationChecks,
  validate,
  leaderboardController.getLeaderboard
);

router.get(
  '/friends',
  periodCheck,
  ...paginationChecks,
  validate,
  leaderboardController.getFriendsLeaderboard
);

router.get(
  '/me',
  periodCheck,
  validate,
  leaderboardController.getUserRank
);

module.exports = router;
