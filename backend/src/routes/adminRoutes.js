const router = require('express').Router();
const { protect } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { getMetrics, getAnalytics } = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/metrics', getMetrics);
router.get('/analytics', getAnalytics);

module.exports = router;
