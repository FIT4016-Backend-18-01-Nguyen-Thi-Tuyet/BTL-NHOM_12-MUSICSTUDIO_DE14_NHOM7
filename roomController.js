const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM rooms ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM rooms WHERE id = @id');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy phòng' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, capacity, hourly_rate, image_url } = req.body;
    if (!name || !hourly_rate)
      return res.status(400).json({ message: 'Tên phòng và giá thuê là bắt buộc' });

    const pool = getPool();
    await pool.request()
      .input('name',        sql.NVarChar,    name)
      .input('description', sql.NVarChar,    description || null)
      .input('capacity',    sql.Int,         capacity || 1)
      .input('hourly_rate', sql.Decimal(10,2), hourly_rate)
      .input('image_url',   sql.NVarChar,    image_url || null)
      .query(`INSERT INTO rooms (name, description, capacity, hourly_rate, image_url)
              VALUES (@name, @description, @capacity, @hourly_rate, @image_url)`);

    res.status(201).json({ message: 'Thêm phòng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, description, capacity, hourly_rate, status, image_url } = req.body;
    const pool = getPool();
    await pool.request()
      .input('id',          sql.Int,         req.params.id)
      .input('name',        sql.NVarChar,    name)
      .input('description', sql.NVarChar,    description)
      .input('capacity',    sql.Int,         capacity)
      .input('hourly_rate', sql.Decimal(10,2), hourly_rate)
      .input('status',      sql.NVarChar,    status)
      .input('image_url',   sql.NVarChar,    image_url)
      .query(`UPDATE rooms SET name=@name, description=@description, capacity=@capacity,
              hourly_rate=@hourly_rate, status=@status, image_url=@image_url,
              updated_at=GETDATE() WHERE id=@id`);
    res.json({ message: 'Cập nhật phòng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM rooms WHERE id = @id');
    res.json({ message: 'Xóa phòng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getSchedule = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM view_room_schedule ORDER BY start_time');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getSchedule };
