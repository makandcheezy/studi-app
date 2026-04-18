// seed script — populates sessions + friendships for dev testing
// does NOT modify User records (preserves display names)
// usage: npm run seed (from backend/ directory)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Friendship = require('../src/models/Friendship');
const { calculatePoints } = require('../src/services/pointsService');

const ME_EMAIL = 'adammakled2004@gmail.com';

const SUBJECTS = [
  'Software Engineering',
  'Data Structures',
  'Linear Algebra',
  'Organic Chemistry',
  'World History',
  'Macroeconomics',
  'Operating Systems',
  'Statistics',
  'Psychology',
  'Physics II',
];

const MINUTES_AGO = (n) => new Date(Date.now() - n * 60 * 1000);
const HOURS_AGO = (n) => new Date(Date.now() - n * 60 * 60 * 1000);
const DAYS_AGO = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

function pick(arr, i) {
  return arr[i % arr.length];
}

function makeSession(userId, startTime, durationMinutes, subject, streak = 0) {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return {
    userId,
    subject,
    durationMinutes,
    startTime,
    endTime,
    status: 'completed',
    pointsEarned: calculatePoints(durationMinutes, streak),
  };
}

// buckets for leaderboard coverage — each fake user gets one session per bucket
// picked so all three time windows (daily / weekly / monthly) get data
function leaderboardSessionsFor(userId, seedIndex) {
  const hoursToday = 2 + (seedIndex % 6);
  const daysThisWeek = 2 + (seedIndex % 3);
  const daysThisMonth = 10 + (seedIndex % 8);
  const daysAllTime = 45 + (seedIndex % 20);

  return [
    makeSession(userId, HOURS_AGO(hoursToday), 30 + (seedIndex * 7) % 60, pick(SUBJECTS, seedIndex)),
    makeSession(userId, DAYS_AGO(daysThisWeek), 45 + (seedIndex * 5) % 45, pick(SUBJECTS, seedIndex + 1)),
    makeSession(userId, DAYS_AGO(daysThisMonth), 25 + (seedIndex * 3) % 50, pick(SUBJECTS, seedIndex + 2)),
    makeSession(userId, DAYS_AGO(daysAllTime), 60, pick(SUBJECTS, seedIndex + 3)),
  ];
}

// activity feed coverage — varied relative timestamps to exercise the "just now / X hours / yesterday" formatter
function activitySessionsFor(userId, seedIndex) {
  const offsets = [
    MINUTES_AGO(3),
    MINUTES_AGO(22 + seedIndex * 4),
    HOURS_AGO(2 + seedIndex),
    HOURS_AGO(8 + seedIndex * 2),
    DAYS_AGO(1),
    DAYS_AGO(3 + (seedIndex % 3)),
  ];

  return offsets.map((start, i) =>
    makeSession(userId, start, 20 + ((seedIndex + i) * 11) % 70, pick(SUBJECTS, seedIndex + i))
  );
}

async function seed() {
  await connectDB();

  const me = await User.findOne({ email: ME_EMAIL });
  if (!me) {
    throw new Error(`current user "${ME_EMAIL}" not found — register the account first, then re-run seed`);
  }
  console.log(`Found current user: ${me.displayName} (${me.email})`);

  const fakeUsers = await User.find({
    _id: { $ne: me._id },
    role: { $ne: 'admin' },
  });

  if (fakeUsers.length === 0) {
    throw new Error('no fake student users found — the seeded users (Alice, Bob, ...) need to exist in the DB first');
  }
  console.log(`Found ${fakeUsers.length} fake users: ${fakeUsers.map((u) => u.displayName).join(', ')}`);

  const fakeIds = fakeUsers.map((u) => u._id);

  // clear only fake users' sessions; leave Adam's own sessions alone
  const deletedSessions = await Session.deleteMany({ userId: { $in: fakeIds } });
  console.log(`Cleared ${deletedSessions.deletedCount} existing fake-user sessions.`);

  // clear only test friendships (both parties are me or fake) — leaves any unrelated friendships intact
  const involvedIds = [me._id, ...fakeIds];
  const deletedFriendships = await Friendship.deleteMany({
    requester: { $in: involvedIds },
    recipient: { $in: involvedIds },
  });
  console.log(`Cleared ${deletedFriendships.deletedCount} existing test friendships.`);

  // pick the first 5 fake users as Adam's friends
  const friendCount = Math.min(5, fakeUsers.length);
  const friendsOfMe = fakeUsers.slice(0, friendCount);
  const nonFriends = fakeUsers.slice(friendCount);

  // sessions: leaderboard coverage for everyone + activity coverage for friends
  const sessions = [];
  fakeUsers.forEach((user, i) => {
    sessions.push(...leaderboardSessionsFor(user._id, i));
  });
  friendsOfMe.forEach((user, i) => {
    sessions.push(...activitySessionsFor(user._id, i));
  });

  await Session.insertMany(sessions);
  console.log(`Inserted ${sessions.length} sessions.`);

  // friendships: Adam <-> each friend, accepted
  const friendships = friendsOfMe.map((user) => ({
    requester: me._id,
    recipient: user._id,
    status: 'accepted',
  }));

  await Friendship.insertMany(friendships);
  console.log(`Created ${friendships.length} accepted friendships with: ${friendsOfMe.map((u) => u.displayName).join(', ')}`);
  if (nonFriends.length > 0) {
    console.log(`Non-friends (still on leaderboard, not in activity feed): ${nonFriends.map((u) => u.displayName).join(', ')}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
