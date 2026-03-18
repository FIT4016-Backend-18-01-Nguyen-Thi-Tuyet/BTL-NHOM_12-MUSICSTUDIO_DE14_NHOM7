const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

// ── Register ────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, password, full_name, email, phone } = req.body;

    if (!username || !password || !full_name || !email)
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });

    const pool = getPool();

    const existing = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE username=@username OR email=@email');

    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Username hoặc email đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, hashedPassword)
      .input('full_name', sql.NVarChar, full_name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone || null)
      .input('role_id', sql.Int, 3)
      .query(`
        INSERT INTO users (role_id, username, password, full_name, email, phone)
        VALUES (@role_id, @username, @password, @full_name, @email, @phone)
      `);

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Login ───────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("BODY:", req.body);
    console.log("RAW PASSWORD:", password);

    if (!username || !password)
      return res.status(400).json({ message: 'Vui lòng nhập username và password' });

    const cleanPassword = password.trim();
    console.log("CLEAN PASSWORD:", cleanPassword);

    const pool = getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT u.id, u.username, u.password, u.full_name, u.email, u.phone,
               u.is_active, r.name AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.username = @username
      `);

    const user = result.recordset[0];

    if (!user) {
      console.log("❌ USER NOT FOUND");
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }

    if (!user.is_active) {
      console.log("❌ USER LOCKED");
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    console.log("DB:", getPool().config.database);
    console.log("SERVER:", getPool().config.server);
    console.log("HASH DB:", user.password);

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    console.log("COMPARE RESULT:", isMatch);

    if (!isMatch)
      return res.status(401).json({ message: 'Sai mật khẩu' });

    // ✅ FIX JWT (QUAN TRỌNG)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    await pool.request()
      .input('token', sql.NVarChar, token)
      .input('id', sql.Int, user.id)
      .query('UPDATE users SET jwt_token=@token WHERE id=@id');

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Logout ──────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    if (req.user) {
      const pool = getPool();
      await pool.request()
        .input('id', sql.Int, req.user.id)
        .query('UPDATE users SET jwt_token=NULL, session_token=NULL WHERE id=@id');
    }
    req.session.destroy();
    res.json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error("🔥 LOGOUT ERROR:", err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Get Profile ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query(`
        SELECT u.id, u.username, u.full_name, u.email, u.phone, r.name AS role, u.created_at
        FROM users u 
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = @id
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("🔥 PROFILE ERROR:", err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { register, login, logout, getProfile };