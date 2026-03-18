// routes/bookings.js
const express = require('express');
const router = express.Router();
const c = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/',              authenticate, authorize('admin','staff'), c.getAll);
router.get('/my',            authenticate, c.getMyBookings);
router.post('/',             authenticate, c.create);
router.patch('/:id/status',  authenticate, authorize('admin','staff'), c.updateStatus);
router.patch('/:id/cancel',  authenticate, c.cancel);

module.exports = router;
