const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, toggleActive, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/',          authenticate, authorize('admin'), getAllUsers);
router.get('/:id',       authenticate, authorize('admin', 'staff'), getUserById);
router.put('/:id',       authenticate, authorize('admin'), updateUser);
router.patch('/:id/toggle', authenticate, authorize('admin'), toggleActive);
router.delete('/:id',    authenticate, authorize('admin'), deleteUser);

module.exports = router;
