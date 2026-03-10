// user endpoints — profile viewing/editing and user search (US-3)
const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ success: true, data: { message: 'get profile placeholder' } });
});

router.patch('/me', (req, res) => {
  res.json({ success: true, data: { message: 'update profile placeholder' } });
});

router.get('/search', (req, res) => {
  res.json({ success: true, data: { message: 'search users placeholder' } });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, data: { message: 'get user by id placeholder' } });
});

module.exports = router;
