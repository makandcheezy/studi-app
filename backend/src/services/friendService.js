const mongoose = require('mongoose');
const Friendship = require('../models/Friendship');
const Session = require('../models/Session');
const User = require('../models/User');
const AppError = require('../utils/AppError');

function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

function formatUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    displayName: userDoc.displayName,
    email: userDoc.email,
    avatar: userDoc.avatar,
    totalPoints: userDoc.totalPoints,
    currentStreak: userDoc.currentStreak,
  };
}

function formatFriendship(friendship, currentUserId) {
  const isRequester = friendship.requester._id.toString() === currentUserId.toString();
  const otherUser = isRequester ? friendship.recipient : friendship.requester;

  return {
    id: friendship._id.toString(),
    status: friendship.status,
    direction: isRequester ? 'outgoing' : 'incoming',
    requesterId: friendship.requester._id.toString(),
    recipientId: friendship.recipient._id.toString(),
    user: formatUser(otherUser),
    createdAt: friendship.createdAt,
    updatedAt: friendship.updatedAt,
  };
}

async function findRelationship(userId, otherUserId) {
  return Friendship.findOne({
    $or: [
      { requester: userId, recipient: otherUserId },
      { requester: otherUserId, recipient: userId },
    ],
  });
}

async function sendFriendRequest(userId, recipientId) {
  if (userId.toString() === recipientId.toString()) {
    throw new AppError('You cannot send a friend request to yourself', 400, 'VALIDATION_ERROR');
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  let friendship = await findRelationship(userId, recipientId);

  if (friendship) {
    if (friendship.status === 'accepted') {
      throw new AppError('You are already friends with this user', 409, 'CONFLICT');
    }

    if (friendship.status === 'pending') {
      if (friendship.requester.toString() === userId.toString()) {
        throw new AppError('Friend request already sent', 409, 'CONFLICT');
      }

      throw new AppError('This user has already sent you a friend request', 409, 'CONFLICT');
    }

    friendship.requester = userId;
    friendship.recipient = recipientId;
    friendship.status = 'pending';
    await friendship.save();
  } else {
    friendship = await Friendship.create({
      requester: userId,
      recipient: recipientId,
      status: 'pending',
    });
  }

  return Friendship.findById(friendship._id)
    .populate('requester', 'displayName email avatar totalPoints currentStreak')
    .populate('recipient', 'displayName email avatar totalPoints currentStreak');
}

async function getFriends(userId) {
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .sort({ updatedAt: -1 })
    .populate('requester', 'displayName email avatar totalPoints currentStreak')
    .populate('recipient', 'displayName email avatar totalPoints currentStreak');

  return friendships.map((friendship) => formatFriendship(friendship, userId));
}

async function getPendingRequests(userId) {
  const friendships = await Friendship.find({
    status: 'pending',
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .sort({ createdAt: -1 })
    .populate('requester', 'displayName email avatar totalPoints currentStreak')
    .populate('recipient', 'displayName email avatar totalPoints currentStreak');

  const incoming = [];
  const outgoing = [];

  friendships.forEach((friendship) => {
    const formatted = formatFriendship(friendship, userId);
    if (formatted.direction === 'incoming') {
      incoming.push(formatted);
    } else {
      outgoing.push(formatted);
    }
  });

  return { incoming, outgoing };
}

async function searchUsers(userId, query) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const currentUserId = toObjectId(userId);
  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { displayName: { $regex: trimmedQuery, $options: 'i' } },
      { email: { $regex: trimmedQuery, $options: 'i' } },
    ],
  })
    .sort({ displayName: 1 })
    .limit(10)
    .select('displayName email avatar totalPoints currentStreak');

  const userIds = users.map((user) => user._id);
  const friendships = await Friendship.find({
    $or: [
      { requester: currentUserId, recipient: { $in: userIds } },
      { requester: { $in: userIds }, recipient: currentUserId },
    ],
  });

  const relationshipMap = new Map();
  friendships.forEach((friendship) => {
    const otherId =
      friendship.requester.toString() === userId.toString()
        ? friendship.recipient.toString()
        : friendship.requester.toString();

    relationshipMap.set(otherId, {
      id: friendship._id.toString(),
      status: friendship.status,
      direction:
        friendship.requester.toString() === userId.toString() ? 'outgoing' : 'incoming',
    });
  });

  return users.map((user) => ({
    ...formatUser(user),
    relationship: relationshipMap.get(user._id.toString()) || null,
  }));
}

async function getFriendActivity(userId) {
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  }).select('requester recipient');

  const friendIds = friendships.map((friendship) =>
    friendship.requester.toString() === userId.toString()
      ? friendship.recipient
      : friendship.requester
  );

  if (friendIds.length === 0) {
    return [];
  }

  const sessions = await Session.find({
    userId: { $in: friendIds },
    status: 'completed',
  })
    .sort({ endTime: -1 })
    .limit(10)
    .populate('userId', 'displayName');

  return sessions.map((session) => ({
    id: session._id.toString(),
    userId: session.userId?._id?.toString() || '',
    displayName: session.userId?.displayName || 'Unknown User',
    subject: session.subject,
    durationMinutes: session.durationMinutes,
    pointsEarned: session.pointsEarned,
    completedAt: session.endTime,
  }));
}

async function acceptFriendRequest(friendshipId, userId) {
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    recipient: userId,
    status: 'pending',
  });

  if (!friendship) {
    throw new AppError('Friend request not found', 404, 'NOT_FOUND');
  }

  friendship.status = 'accepted';
  await friendship.save();

  return Friendship.findById(friendship._id)
    .populate('requester', 'displayName email avatar totalPoints currentStreak')
    .populate('recipient', 'displayName email avatar totalPoints currentStreak');
}

async function declineFriendRequest(friendshipId, userId) {
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    recipient: userId,
    status: 'pending',
  });

  if (!friendship) {
    throw new AppError('Friend request not found', 404, 'NOT_FOUND');
  }

  friendship.status = 'declined';
  await friendship.save();

  return Friendship.findById(friendship._id)
    .populate('requester', 'displayName email avatar totalPoints currentStreak')
    .populate('recipient', 'displayName email avatar totalPoints currentStreak');
}

async function removeFriend(friendshipId, userId) {
  const friendship = await Friendship.findOne({
    _id: friendshipId,
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  });

  if (!friendship) {
    throw new AppError('Friendship not found', 404, 'NOT_FOUND');
  }

  await Friendship.deleteOne({ _id: friendshipId });
}

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
