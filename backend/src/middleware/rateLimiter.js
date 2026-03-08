// rate limiter for auth routes — 10 requests per 15 min per ip
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };
