// seed script — populates the database with dummy users for development/testing
// usage: npm run seed (from backend/ directory)
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const BCRYPT_ROUNDS = 12;
const STUDENT_PASSWORD = 'Password1!';
const ADMIN_PASSWORD = 'Admin1234!';

async function seed() {
  await connectDB();

  await User.deleteMany({});
  console.log('Cleared existing users.');

  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, BCRYPT_ROUNDS);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const now = new Date();
  const daysAgo = (n) => new Date(now - n * 24 * 60 * 60 * 1000);

  const users = [
    // 1 admin
    {
      email: 'admin@studi.dev',
      passwordHash: adminHash,
      displayName: 'Admin',
      role: 'admin',
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    },
    // 9 students with varied points and streaks
    {
      email: 'alice@studi.dev',
      passwordHash: studentHash,
      displayName: 'Alice',
      role: 'student',
      totalPoints: 2100,
      currentStreak: 10,
      longestStreak: 14,
      lastStudyDate: now,
    },
    {
      email: 'bob@studi.dev',
      passwordHash: studentHash,
      displayName: 'Bob',
      role: 'student',
      totalPoints: 1750,
      currentStreak: 7,
      longestStreak: 10,
      lastStudyDate: now,
    },
    {
      email: 'carol@studi.dev',
      passwordHash: studentHash,
      displayName: 'Carol',
      role: 'student',
      totalPoints: 1400,
      currentStreak: 5,
      longestStreak: 8,
      lastStudyDate: daysAgo(1),
    },
    {
      email: 'david@studi.dev',
      passwordHash: studentHash,
      displayName: 'David',
      role: 'student',
      totalPoints: 1050,
      currentStreak: 3,
      longestStreak: 9,
      lastStudyDate: daysAgo(1),
    },
    {
      email: 'emma@studi.dev',
      passwordHash: studentHash,
      displayName: 'Emma',
      role: 'student',
      totalPoints: 780,
      currentStreak: 2,
      longestStreak: 6,
      lastStudyDate: daysAgo(2),
    },
    {
      email: 'frank@studi.dev',
      passwordHash: studentHash,
      displayName: 'Frank',
      role: 'student',
      totalPoints: 430,
      currentStreak: 1,
      longestStreak: 4,
      lastStudyDate: daysAgo(3),
    },
    {
      email: 'grace@studi.dev',
      passwordHash: studentHash,
      displayName: 'Grace',
      role: 'student',
      totalPoints: 200,
      currentStreak: 0,
      longestStreak: 3,
      lastStudyDate: daysAgo(7),
    },
    {
      email: 'henry@studi.dev',
      passwordHash: studentHash,
      displayName: 'Henry',
      role: 'student',
      totalPoints: 80,
      currentStreak: 0,
      longestStreak: 1,
      lastStudyDate: daysAgo(14),
    },
    {
      email: 'iris@studi.dev',
      passwordHash: studentHash,
      displayName: 'Iris',
      role: 'student',
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    },
  ];

  await User.insertMany(users);
  console.log(`Seeded ${users.length} users (1 admin, ${users.length - 1} students).`);
  console.log(`\nTest credentials:`);
  console.log(`  Admin  — email: admin@studi.dev  | password: ${ADMIN_PASSWORD}`);
  console.log(`  Student — email: alice@studi.dev | password: ${STUDENT_PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
