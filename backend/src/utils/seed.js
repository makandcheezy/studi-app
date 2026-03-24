// seed script — creates test users + sessions, then runs leaderboard queries
// usage: node src/utils/seed.js          (seed + test)
//        node src/utils/seed.js --clean  (wipe test data only)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Session = require('../models/Session');
const { calculatePoints } = require('../services/pointsService');
const leaderboardService = require('../services/leaderboardService');

const TEST_EMAILS = [
  'alex@test.com',
  'jordan@test.com',
  'sam@test.com',
  'taylor@test.com',
  'casey@test.com',
];

function daysAgo(n) {
  const now = new Date();
  const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (n === 0) {
    // halfway between UTC midnight and now — always within today's UTC date
    return new Date(utcToday + (now.getTime() - utcToday) / 2);
  }

  // past days: noon UTC on that day
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n, 12, 0, 0));
}

async function clean() {
  const testUsers = await User.find({ email: { $in: TEST_EMAILS } });
  const testUserIds = testUsers.map((u) => u._id);

  const sessionResult = await Session.deleteMany({ userId: { $in: testUserIds } });
  const userResult = await User.deleteMany({ email: { $in: TEST_EMAILS } });
  console.log(`cleaned ${userResult.deletedCount} users, ${sessionResult.deletedCount} sessions`);
}

async function seed() {
  const userDefs = [
    {
      email: 'alex@test.com',
      passwordHash: 'placeholder',
      displayName: 'Adam Makled',
      currentStreak: 10,
      longestStreak: 14,
      lastStudyDate: daysAgo(0),
    },
    {
      email: 'jordan@test.com',
      passwordHash: 'placeholder',
      displayName: 'Yusra Hashami',
      currentStreak: 5,
      longestStreak: 8,
      lastStudyDate: daysAgo(1),
    },
    {
      email: 'sam@test.com',
      passwordHash: 'placeholder',
      displayName: 'Shayla Pham',
      currentStreak: 2,
      longestStreak: 6,
      lastStudyDate: daysAgo(0),
    },
    {
      email: 'taylor@test.com',
      passwordHash: 'placeholder',
      displayName: 'Seth Jones',
      currentStreak: 0,
      longestStreak: 5,
      lastStudyDate: daysAgo(7),
    },
    {
      email: 'casey@test.com',
      passwordHash: 'placeholder',
      displayName: 'Casey Patel',
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: daysAgo(0),
    },
  ];

  const users = await User.insertMany(userDefs);
  const [alex, jordan, sam, taylor, casey] = users;

  // each session: [user, subject, durationMinutes, daysAgo, location]
  const sessionDefs = [
    // alex — heavy studier, long sessions, 10-day streak (mult 1.35)
    [alex, 'Calculus', 90, 13, 'Library West'],
    [alex, 'Physics', 60, 10, 'Marston'],
    [alex, 'Linear Algebra', 120, 5, 'Library West'],
    [alex, 'Chemistry', 45, 2, 'Home'],
    [alex, 'Calculus', 30, 0, 'Library West'],

    // jordan — decent studier, one sub-5min session, 5-day streak (mult 1.15)
    [jordan, 'Art History', 3, 8, ''],
    [jordan, 'Biology', 180, 6, 'Marston'],
    [jordan, 'English Lit', 30, 3, 'Home'],
    [jordan, 'Biology', 45, 1, 'Marston'],

    // sam — moderate, 2-day streak (mult 1.0)
    [sam, 'US History', 15, 10, 'Home'],
    [sam, 'Computer Science', 200, 4, 'CSE Building'],
    [sam, 'US History', 25, 1, 'Library West'],
    [sam, 'Discrete Math', 10, 0, 'Home'],

    // taylor — stopped studying a week ago, 0 streak (mult 1.0)
    [taylor, 'Psychology', 60, 12, 'Home'],
    [taylor, 'Statistics', 90, 9, 'Marston'],
    [taylor, 'Psychology', 4, 7, 'Home'],

    // casey — brand new, just started today, 1-day streak (mult 1.0)
    [casey, 'Economics', 35, 0, 'Library West'],
    [casey, 'Study Break', 2, 0, ''],
  ];

  const sessions = sessionDefs.map(([user, subject, duration, ago, location]) => {
    const startTime = daysAgo(ago);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const pointsEarned = calculatePoints(duration, user.currentStreak);

    return {
      userId: user._id,
      subject,
      durationMinutes: duration,
      startTime,
      endTime,
      status: 'completed',
      pausedDuration: 0,
      pointsEarned,
      location,
    };
  });

  await Session.insertMany(sessions);

  // update each user's totalPoints to match their session points
  for (const user of users) {
    const total = sessions
      .filter((s) => s.userId.equals(user._id))
      .reduce((sum, s) => sum + s.pointsEarned, 0);
    await User.findByIdAndUpdate(user._id, { $set: { totalPoints: total } });
  }

  // print seed summary
  console.log(`\nseeded ${users.length} users, ${sessions.length} sessions\n`);

  for (const user of users) {
    const userSessions = sessions.filter((s) => s.userId.equals(user._id));
    const total = userSessions.reduce((sum, s) => sum + s.pointsEarned, 0);
    console.log(
      `  ${user.displayName.padEnd(14)} | ${String(total).padStart(5)} pts | ` +
        `streak ${String(user.currentStreak).padStart(2)} | ${userSessions.length} sessions`
    );

    for (const s of userSessions) {
      const ago = Math.round((Date.now() - s.startTime.getTime()) / (1000 * 60 * 60 * 24));
      console.log(
        `    └ ${s.subject.padEnd(18)} ${String(s.durationMinutes).padStart(3)} min → ` +
          `${String(s.pointsEarned).padStart(5)} xp  (${ago}d ago)`
      );
    }
  }

  return { users, sessions };
}

async function testLeaderboard(users) {
  const periods = ['daily', 'weekly', 'monthly', 'allTime'];

  for (const period of periods) {
    const result = await leaderboardService.getLeaderboard({ period, page: 1, limit: 20 });
    console.log(`\n--- leaderboard: ${period} (${result.pagination.total} users) ---`);

    if (result.entries.length === 0) {
      console.log('  (no entries)');
      continue;
    }

    for (const entry of result.entries) {
      console.log(
        `  #${entry.rank} ${entry.displayName.padEnd(14)} | ` +
          `${String(entry.totalPoints).padStart(5)} pts | ` +
          `${String(entry.totalMinutes).padStart(4)} min | ` +
          `${entry.sessionCount} sessions`
      );
    }
  }

  // test user rank for alex
  const alex = users[0];
  const rankResult = await leaderboardService.getUserRank(alex._id.toString(), {
    period: 'weekly',
  });

  console.log(`\n--- ${alex.displayName}'s rank (weekly) ---`);
  if (rankResult.rank === null) {
    console.log('  not ranked this period');
  } else {
    console.log(`  rank: #${rankResult.rank}`);
    for (const entry of rankResult.entries) {
      const marker = entry.isCurrentUser ? ' ←' : '';
      console.log(
        `  #${entry.rank} ${entry.displayName.padEnd(14)} | ` +
          `${String(entry.totalPoints).padStart(5)} pts${marker}`
      );
    }
  }
}

async function main() {
  await connectDB();

  if (process.argv.includes('--clean')) {
    await clean();
    await mongoose.disconnect();
    return;
  }

  await clean();
  const { users } = await seed();
  await testLeaderboard(users);

  console.log('\ndone');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
