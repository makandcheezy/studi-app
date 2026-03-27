const friendService = require('../services/friendService');

const sendFriendRequest = async (req, res, next) => {
  try {
    const friendship = await friendService.sendFriendRequest(req.user.id, req.body.recipientId);
    res.status(201).json({ success: true, data: { friendship } });
  } catch (err) {
    next(err);
  }
};

const getFriends = async (req, res, next) => {
  try {
    const friends = await friendService.getFriends(req.user.id);
    res.json({ success: true, data: { friends } });
  } catch (err) {
    next(err);
  }
};

const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await friendService.getPendingRequests(req.user.id);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const users = await friendService.searchUsers(req.user.id, req.query.q || '');
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};

const getFriendActivity = async (req, res, next) => {
  try {
    const activity = await friendService.getFriendActivity(req.user.id);
    res.json({ success: true, data: { activity } });
  } catch (err) {
    next(err);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const friendship = await friendService.acceptFriendRequest(req.params.id, req.user.id);
    res.json({ success: true, data: { friendship } });
  } catch (err) {
    next(err);
  }
};

const declineFriendRequest = async (req, res, next) => {
  try {
    const friendship = await friendService.declineFriendRequest(req.params.id, req.user.id);
    res.json({ success: true, data: { friendship } });
  } catch (err) {
    next(err);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    await friendService.removeFriend(req.params.id, req.user.id);
    res.json({ success: true, data: { message: 'Friend removed successfully' } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendFriendRequest,
  getFriends,
  getPendingRequests,
  searchUsers,
  getFriendActivity,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
};
