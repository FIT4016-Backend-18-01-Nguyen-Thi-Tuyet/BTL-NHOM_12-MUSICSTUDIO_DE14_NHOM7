const express = require('express');
const router = express.Router();
const c = require('../controllers/roomController');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/',           authenticate, c.getAll);
router.get('/schedule',   authenticate, c.getSchedule);
router.get('/:id',        authenticate, c.getById);
router.post('/',          authenticate, authorize('admin','staff'), c.create);
router.put('/:id',        authenticate, authorize('admin','staff'), c.update);
router.delete('/:id',     authenticate, authorize('admin'), c.remove);

module.exports = router;
