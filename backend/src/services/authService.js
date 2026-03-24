// auth business logic — no req/res, throws AppError on failure
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// --- internal helpers ---

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

// --- exported service functions ---

async function registerUser({ email, password, displayName }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_IN_USE');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, displayName, role: 'student' });

  const payload = { id: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  return { user, accessToken, refreshToken };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const payload = { id: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  return { user, accessToken, refreshToken };
}

async function refreshAccessToken(incomingRefreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokenHash) {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  const match = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
  if (!match) {
    // possible token reuse — invalidate stored token
    user.refreshTokenHash = null;
    await user.save();
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
  return { accessToken };
}

async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };
