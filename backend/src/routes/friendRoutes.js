// friend endpoints — requests, accept/decline, friends list, activity (US-7)
const express = require('express');
const router = express.Router();

router.post('/request', (req, res) => {
  res.json({ success: true, data: { message: 'send friend request placeholder' } });
});

router.get('/', (req, res) => {
  res.json({ success: true, data: { message: 'get friends list placeholder' } });
});

router.get('/requests', (req, res) => {
  res.json({ success: true, data: { message: 'get pending requests placeholder' } });
});

router.get('/activity', (req, res) => {
  res.json({ success: true, data: { message: 'get friend activity placeholder' } });
});

router.patch('/:id/accept', (req, res) => {
  res.json({ success: true, data: { message: 'accept friend request placeholder' } });
});

router.patch('/:id/decline', (req, res) => {
  res.json({ success: true, data: { message: 'decline friend request placeholder' } });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, data: { message: 'remove friend placeholder' } });
});

module.exports = router;
