// auth controller — http layer only, delegates to authService
const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const AppError = require('../utils/AppError');
const User = require('../models/User');

function checkValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }
}

function safeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

const registerUser = async (req, res, next) => {
  try {
    checkValidation(req);
    const { email, password, displayName } = req.body;
    const { user, accessToken, refreshToken } = await authService.registerUser({
      email,
      password,
      displayName,
    });
    res.status(201).json({
      success: true,
      data: { accessToken, refreshToken, user: safeUser(user) },
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    checkValidation(req);
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser({ email, password });
    User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(() => {});
    res.status(200).json({
      success: true,
      data: { accessToken, refreshToken, user: safeUser(user) },
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: incomingToken } = req.body;
    if (!incomingToken) {
      throw new AppError('Refresh token required', 400, 'VALIDATION_ERROR');
    }
    const { accessToken } = await authService.refreshAccessToken(incomingToken);
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user.id);
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser, refreshToken, logoutUser };
