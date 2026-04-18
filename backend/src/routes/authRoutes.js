// auth endpoints — register, login, token refresh, logout (US-1, US-2)
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerUser, loginUser, refreshToken, logoutUser } = require('../controllers/authController');

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Display name must be 2–30 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register', authLimiter, registerValidation, registerUser);
router.post('/login',    authLimiter, loginValidation,    loginUser);
// /refresh does NOT use protect — it authenticates via the refresh token itself,
// which is verified and compared against the stored hash inside the controller.
// gating it behind an access token would make it unreachable once the access token expires.
router.post('/refresh',                                   refreshToken);
router.post('/logout',   protect,                         logoutUser);

module.exports = router;
