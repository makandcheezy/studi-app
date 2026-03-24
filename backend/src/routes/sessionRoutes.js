// session endpoints — start, pause, resume, end, and history (US-4, US-6, US-10)
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const sessionController = require('../controllers/sessionController');

router.use(protect);

router.post(
  '/',
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 100 }),
  body('location').optional().trim().isLength({ max: 100 }),
  validate,
  sessionController.startSession
);

router.get(
  '/',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('subject').optional().trim(),
  query('from').optional().isISO8601().withMessage('Invalid date format'),
  query('to').optional().isISO8601().withMessage('Invalid date format'),
  validate,
  sessionController.getSessionHistory
);

router.get('/active', sessionController.getActiveSession);

router.patch(
  '/:id/pause',
  param('id').isMongoId().withMessage('Invalid session ID'),
  validate,
  sessionController.pauseSession
);

router.patch(
  '/:id/resume',
  param('id').isMongoId().withMessage('Invalid session ID'),
  validate,
  sessionController.resumeSession
);

router.patch(
  '/:id/end',
  param('id').isMongoId().withMessage('Invalid session ID'),
  validate,
  sessionController.endSession
);

module.exports = router;
