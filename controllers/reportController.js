const { getPool, sql } = require('../config/db');

const getStatistics = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM view_statistics');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const pool = getPool();

    const [users, instruments, rooms, bookings, borrows] = await Promise.all([
      pool.request().query('SELECT COUNT(*) AS total FROM users'),
      pool.request().query("SELECT COUNT(*) AS total FROM instruments WHERE status='available'"),
      pool.request().query("SELECT COUNT(*) AS total FROM rooms WHERE status='available'"),
      pool.request().query("SELECT COUNT(*) AS total FROM bookings WHERE status IN ('pending','confirmed')"),
      pool.request().query("SELECT COUNT(*) AS total FROM borrow_transactions WHERE status='borrowed'"),
    ]);

    res.json({
      total_users:           users.recordset[0].total,
      available_instruments: instruments.recordset[0].total,
      available_rooms:       rooms.recordset[0].total,
      active_bookings:       bookings.recordset[0].total,
      active_borrows:        borrows.recordset[0].total,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getStatistics, getDashboard };
