// session service — start/pause/resume/end with points and streak integration (US-10)

const Session = require('../models/Session');
const User = require('../models/User');
const { calculatePoints } = require('./pointsService');
const { computeStreakUpdate, checkStreakExpiry } = require('./streakService');

async function startSession(userId, { subject, location }) {
  const existing = await Session.findOne({
    userId,
    status: { $in: ['active', 'paused'] },
  });
  if (existing) {
    const err = new Error('You already have an active session');
    err.statusCode = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  // lazy streak check — reset if days have passed without studying
  const user = await User.findById(userId);
  const { expired } = checkStreakExpiry(user.lastStudyDate, user.currentStreak);
  if (expired) {
    await User.findByIdAndUpdate(userId, { $set: { currentStreak: 0 } });
  }

  const session = await Session.create({
    userId,
    subject,
    location: location || '',
    startTime: new Date(),
    status: 'active',
  });

  return session;
}

async function getActiveSession(userId) {
  return Session.findOne({ userId, status: { $in: ['active', 'paused'] } });
}

async function pauseSession(sessionId, userId) {
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (session.status !== 'active') {
    const err = new Error('Session is not active');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  session.status = 'paused';
  session.pausedAt = new Date();
  await session.save();
  return session;
}

async function resumeSession(sessionId, userId) {
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (session.status !== 'paused') {
    const err = new Error('Session is not paused');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const pausedMs = Date.now() - session.pausedAt.getTime();
  session.pausedDuration += pausedMs / (1000 * 60);
  session.status = 'active';
  session.pausedAt = null;
  await session.save();
  return session;
}

async function endSession(sessionId, userId) {
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (session.status === 'completed') {
    const err = new Error('Session already completed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const now = new Date();

  // if currently paused, accumulate final pause duration
  if (session.status === 'paused' && session.pausedAt) {
    const pausedMs = now.getTime() - session.pausedAt.getTime();
    session.pausedDuration += pausedMs / (1000 * 60);
  }

  // calculate active study time
  const totalMinutes = (now.getTime() - session.startTime.getTime()) / (1000 * 60);
  const durationMinutes = Math.round(Math.max(0, totalMinutes - session.pausedDuration));

  // get user for streak calculation
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // compute new streak first, then use it for point calculation
  const { currentStreak: newStreak } = computeStreakUpdate(user.lastStudyDate, user.currentStreak);
  const pointsEarned = calculatePoints(durationMinutes, newStreak);

  // complete the session
  session.status = 'completed';
  session.endTime = now;
  session.durationMinutes = durationMinutes;
  session.pointsEarned = pointsEarned;
  session.pausedAt = null;
  await session.save();

  // update user stats only for qualifying sessions (5+ min)
  if (durationMinutes >= 5) {
    const longestStreak = Math.max(newStreak, user.longestStreak);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { totalPoints: pointsEarned },
        $set: { currentStreak: newStreak, longestStreak, lastStudyDate: now },
      },
      { new: true }
    );

    return {
      session,
      userStats: {
        totalPoints: updatedUser.totalPoints,
        currentStreak: updatedUser.currentStreak,
        longestStreak: updatedUser.longestStreak,
      },
    };
  }

  return { session, userStats: null };
}

async function getSessionHistory(userId, { page = 1, limit = 20, subject, from, to } = {}) {
  const filter = { userId, status: 'completed' };

  if (subject) {
    const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.subject = new RegExp(escaped, 'i');
  }
  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    Session.find(filter).sort({ startTime: -1 }).skip(skip).limit(Number(limit)),
    Session.countDocuments(filter),
  ]);

  return {
    sessions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  startSession,
  getActiveSession,
  pauseSession,
  resumeSession,
  endSession,
  getSessionHistory,
};
