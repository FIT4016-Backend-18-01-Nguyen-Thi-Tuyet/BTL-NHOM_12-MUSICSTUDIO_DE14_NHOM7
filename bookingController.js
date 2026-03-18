const { getPool, sql } = require('../config/db');

// ── Check Conflict ──────────────────────────────────────────
const checkConflict = async (pool, room_id, start_time, end_time, exclude_id = 0) => {
  const result = await pool.request()
    .input('room_id',    sql.Int,      room_id)
    .input('start_time', sql.DateTime, new Date(start_time))
    .input('end_time',   sql.DateTime, new Date(end_time))
    .input('exclude_id', sql.Int,      exclude_id)
    .query(`SELECT COUNT(*) AS cnt FROM bookings
            WHERE room_id    = @room_id
              AND status     IN (N'pending', N'confirmed')
              AND id         != @exclude_id
              AND start_time < @end_time
              AND end_time   > @start_time`);
  return result.recordset[0].cnt > 0;
};

// ── Get All Bookings ────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM view_room_schedule ORDER BY start_time DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Get My Bookings ─────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query(`SELECT b.*, r.name AS room_name, r.hourly_rate
              FROM bookings b JOIN rooms r ON r.id = b.room_id
              WHERE b.user_id = @user_id ORDER BY b.start_time DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Create Booking ──────────────────────────────────────────
const create = async (req, res) => {
  try {
    const { room_id, start_time, end_time, notes } = req.body;
    if (!room_id || !start_time || !end_time)
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin đặt phòng' });

    const start = new Date(start_time);
    const end   = new Date(end_time);
    if (end <= start)
      return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });

    const pool = getPool();

    // ⚡ Conflict Resolution
    const hasConflict = await checkConflict(pool, room_id, start_time, end_time);
    if (hasConflict)
      return res.status(409).json({ message: '❌ Phòng đã được đặt trong khung giờ này. Vui lòng chọn giờ khác!' });

    // Tính tiền
    const roomResult = await pool.request()
      .input('id', sql.Int, room_id)
      .query('SELECT hourly_rate FROM rooms WHERE id = @id');
    const room = roomResult.recordset[0];
    if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng' });

    const hours = (end - start) / (1000 * 60 * 60);
    const total_price = hours * parseFloat(room.hourly_rate);

    await pool.request()
      .input('room_id',     sql.Int,         room_id)
      .input('user_id',     sql.Int,         req.user.id)
      .input('start_time',  sql.DateTime,    start)
      .input('end_time',    sql.DateTime,    end)
      .input('total_price', sql.Decimal(10,2), total_price)
      .input('notes',       sql.NVarChar,    notes || null)
      .query(`INSERT INTO bookings (room_id, user_id, start_time, end_time, total_price, notes)
              VALUES (@room_id, @user_id, @start_time, @end_time, @total_price, @notes)`);

    res.status(201).json({ message: '✅ Đặt phòng thành công', total_price });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Update Status ───────────────────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      req.params.id)
      .input('status', sql.NVarChar, status)
      .query('UPDATE bookings SET status=@status, updated_at=GETDATE() WHERE id=@id');
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Cancel Booking ──────────────────────────────────────────
const cancel = async (req, res) => {
  try {
    const pool = getPool();
    const booking = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM bookings WHERE id = @id');

    const b = booking.recordset[0];
    if (!b) return res.status(404).json({ message: 'Không tìm thấy booking' });
    if (b.user_id !== req.user.id && req.user.role === 'customer')
      return res.status(403).json({ message: 'Không có quyền hủy booking này' });

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query("UPDATE bookings SET status='cancelled', updated_at=GETDATE() WHERE id=@id");
    res.json({ message: 'Hủy đặt phòng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getAll, getMyBookings, create, updateStatus, cancel };
