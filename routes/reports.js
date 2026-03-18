const express = require('express');
const router = express.Router();
const { getStatistics, getDashboard } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/dashboard',   authenticate, getDashboard);
router.get('/statistics',  authenticate, authorize('admin','staff'), getStatistics);

module.exports = router;
