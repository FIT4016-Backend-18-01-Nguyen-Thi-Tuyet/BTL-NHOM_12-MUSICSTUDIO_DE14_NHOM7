const express = require('express');
const router = express.Router();
const c = require('../controllers/borrowController');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/',       authenticate, authorize('admin','staff'), c.getAll);
router.post('/borrow', authenticate, authorize('admin','staff'), c.borrowInstrument);
router.post('/return', authenticate, authorize('admin','staff'), c.returnInstrument);

module.exports = router;
