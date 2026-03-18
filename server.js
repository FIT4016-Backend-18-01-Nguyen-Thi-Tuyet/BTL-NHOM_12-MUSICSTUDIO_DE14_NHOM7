const express = require('express');
const cors    = require('cors');
const session = require('express-session');
const path    = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');

const app = express();

// ── Middleware ─────────────────────────
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 
  },
}));

// ── Serve frontend ─────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API ────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/instruments', require('./routes/instruments'));
app.use('/api/rooms',       require('./routes/rooms'));
app.use('/api/bookings',    require('./routes/bookings'));
app.use('/api/borrows',     require('./routes/borrows'));
app.use('/api/reports',     require('./routes/reports'));

// ── Trang chủ ─────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ── 404 ──────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route không tồn tại' });
});

// ── Error ────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Lỗi server', 
    error: err.message 
  });
});

// ── Start ────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {

      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📋 API Endpoints:`);

      const routes = [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET  /api/users',
        'GET  /api/instruments',
        'GET  /api/rooms',
        'POST /api/bookings',
        'POST /api/borrows/borrow',
        'POST /api/borrows/return',
        'GET  /api/reports/dashboard'
      ];

      routes.forEach(route => console.log('   ' + route));
    });
  })
  .catch(err => {
    console.error("❌ DB lỗi:", err.message);
  });