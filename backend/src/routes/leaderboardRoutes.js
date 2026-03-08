// leaderboard endpoints — global, friends-only, and personal rank (US-9)
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: { message: 'get leaderboard placeholder' } });
});

router.get('/friends', (req, res) => {
  res.json({ success: true, data: { message: 'get friends leaderboard placeholder' } });
});

router.get('/me', (req, res) => {
  res.json({ success: true, data: { message: 'get my rank placeholder' } });
});

module.exports = router;
