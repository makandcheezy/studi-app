// friend endpoints — requests, accept/decline, friends list, activity (US-7)
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const friendController = require('../controllers/friendController');

router.use(protect);

router.get(
  '/search',
  query('q').trim(),
  validate,
  friendController.searchUsers
);

router.post(
  '/request',
  body('recipientId').isMongoId().withMessage('Valid recipientId is required'),
  validate,
  friendController.sendFriendRequest
);

router.get('/', friendController.getFriends);

router.get('/requests', friendController.getPendingRequests);

router.get('/activity', friendController.getFriendActivity);

router.patch(
  '/:id/accept',
  param('id').isMongoId().withMessage('Invalid friendship ID'),
  validate,
  friendController.acceptFriendRequest
);

router.patch(
  '/:id/decline',
  param('id').isMongoId().withMessage('Invalid friendship ID'),
  validate,
  friendController.declineFriendRequest
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('Invalid friendship ID'),
  validate,
  friendController.removeFriend
);

module.exports = router;
