const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');

// ── Get All Users (admin) ───────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query(`SELECT u.id, u.username, u.full_name, u.email, u.phone,
                     r.name AS role, u.is_active, u.created_at
              FROM users u JOIN roles r ON r.id = u.role_id
              ORDER BY u.created_at DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Get User By ID ──────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT u.id, u.username, u.full_name, u.email, u.phone,
                     r.name AS role, u.is_active, u.created_at
              FROM users u JOIN roles r ON r.id = u.role_id
              WHERE u.id = @id`);
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy user' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Update User ─────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { full_name, email, phone, role_id } = req.body;
    const pool = getPool();
    await pool.request()
      .input('id',        sql.Int,      req.params.id)
      .input('full_name', sql.NVarChar, full_name)
      .input('email',     sql.NVarChar, email)
      .input('phone',     sql.NVarChar, phone)
      .input('role_id',   sql.Int,      role_id)
      .query(`UPDATE users SET full_name=@full_name, email=@email,
              phone=@phone, role_id=@role_id, updated_at=GETDATE()
              WHERE id=@id`);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Toggle Active ───────────────────────────────────────────
const toggleActive = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE users SET is_active = 1 - is_active WHERE id = @id');
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Delete User ─────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM users WHERE id = @id');
    res.json({ message: 'Xóa user thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, toggleActive, deleteUser };
