// leaderboard service — aggregation pipeline with tie-breaking (US-9)

const mongoose = require('mongoose');
const Session = require('../models/Session');
const Friendship = require('../models/Friendship');

function getDateRange(period) {
  const now = new Date();

  switch (period) {
    case 'daily': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      return { start, end: now };
    }
    case 'weekly': {
      const day = now.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
      return { start, end: now };
    }
    case 'monthly': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { start, end: now };
    }
    case 'allTime':
    default:
      return { start: null, end: null };
  }
}

function buildPipeline({ period, userIds }) {
  const { start } = getDateRange(period);

  const match = { status: 'completed' };
  if (start) match.endTime = { $gte: start };
  if (userIds) match.userId = { $in: userIds };

  return [
    { $match: match },
    {
      $group: {
        _id: '$userId',
        totalPoints: { $sum: '$pointsEarned' },
        totalMinutes: { $sum: '$durationMinutes' },
        sessionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        displayName: '$user.displayName',
        avatar: '$user.avatar',
        totalPoints: 1,
        totalMinutes: 1,
        sessionCount: 1,
        currentStreak: '$user.currentStreak',
        createdAt: '$user.createdAt',
      },
    },
    {
      $sort: {
        totalPoints: -1,
        totalMinutes: -1,
        sessionCount: -1,
        currentStreak: -1,
        createdAt: 1,
      },
    },
  ];
}

async function getFriendIds(userId) {
  const oid = new mongoose.Types.ObjectId(userId);
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: oid }, { recipient: oid }],
  });

  return friendships.map((f) =>
    f.requester.toString() === userId.toString() ? f.recipient : f.requester
  );
}

async function getLeaderboard({ period = 'weekly', page = 1, limit = 20 }) {
  const pipeline = buildPipeline({ period });
  const skip = (page - 1) * limit;

  pipeline.push({
    $facet: {
      entries: [{ $skip: skip }, { $limit: Number(limit) }],
      total: [{ $count: 'count' }],
    },
  });

  const [result] = await Session.aggregate(pipeline);
  const total = result.total[0]?.count || 0;
  const entries = result.entries.map((entry, i) => ({
    rank: skip + i + 1,
    ...entry,
  }));

  return {
    entries,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  };
}

async function getFriendsLeaderboard(userId, { period = 'weekly', page = 1, limit = 20 }) {
  const friendIds = await getFriendIds(userId);
  friendIds.push(new mongoose.Types.ObjectId(userId));

  const pipeline = buildPipeline({ period, userIds: friendIds });
  const skip = (page - 1) * limit;

  pipeline.push({
    $facet: {
      entries: [{ $skip: skip }, { $limit: Number(limit) }],
      total: [{ $count: 'count' }],
    },
  });

  const [result] = await Session.aggregate(pipeline);
  const total = result.total[0]?.count || 0;
  const entries = result.entries.map((entry, i) => ({
    rank: skip + i + 1,
    ...entry,
  }));

  return {
    entries,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  };
}

async function getUserRank(userId, { period = 'weekly' }) {
  const pipeline = buildPipeline({ period });
  const allEntries = await Session.aggregate(pipeline);

  const userIndex = allEntries.findIndex(
    (e) => e.userId.toString() === userId.toString()
  );

  if (userIndex === -1) {
    return { rank: null, entries: [] };
  }

  const sliceStart = Math.max(0, userIndex - 2);
  const sliceEnd = Math.min(allEntries.length, userIndex + 3);

  const entries = allEntries.slice(sliceStart, sliceEnd).map((entry, i) => ({
    rank: sliceStart + i + 1,
    ...entry,
    isCurrentUser: entry.userId.toString() === userId.toString(),
  }));

  return { rank: userIndex + 1, entries };
}

module.exports = {
  getLeaderboard,
  getFriendsLeaderboard,
  getUserRank,
  getDateRange,
  buildPipeline,
};
