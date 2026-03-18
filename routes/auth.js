// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   authenticate, logout);
router.get('/profile',   authenticate, getProfile);

module.exports = router;
