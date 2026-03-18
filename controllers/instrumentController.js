const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM instruments ORDER BY created_at DESC');
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
      .query('SELECT * FROM instruments WHERE id = @id');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy nhạc cụ' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, category, brand, serial_no, description, rental_price, image_url } = req.body;
    if (!name || !rental_price)
      return res.status(400).json({ message: 'Tên và giá thuê là bắt buộc' });

    const pool = getPool();
    await pool.request()
      .input('name',         sql.NVarChar,    name)
      .input('category',     sql.NVarChar,    category || null)
      .input('brand',        sql.NVarChar,    brand || null)
      .input('serial_no',    sql.NVarChar,    serial_no || null)
      .input('description',  sql.NVarChar,    description || null)
      .input('rental_price', sql.Decimal(10,2), rental_price)
      .input('image_url',    sql.NVarChar,    image_url || null)
      .query(`INSERT INTO instruments (name, category, brand, serial_no, description, rental_price, image_url)
              VALUES (@name, @category, @brand, @serial_no, @description, @rental_price, @image_url)`);

    res.status(201).json({ message: 'Thêm nhạc cụ thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, category, brand, serial_no, description, rental_price, status, image_url } = req.body;
    const pool = getPool();
    await pool.request()
      .input('id',           sql.Int,         req.params.id)
      .input('name',         sql.NVarChar,    name)
      .input('category',     sql.NVarChar,    category)
      .input('brand',        sql.NVarChar,    brand)
      .input('serial_no',    sql.NVarChar,    serial_no)
      .input('description',  sql.NVarChar,    description)
      .input('rental_price', sql.Decimal(10,2), rental_price)
      .input('status',       sql.NVarChar,    status)
      .input('image_url',    sql.NVarChar,    image_url)
      .query(`UPDATE instruments SET name=@name, category=@category, brand=@brand,
              serial_no=@serial_no, description=@description, rental_price=@rental_price,
              status=@status, image_url=@image_url, updated_at=GETDATE() WHERE id=@id`);
    res.json({ message: 'Cập nhật nhạc cụ thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM instruments WHERE id = @id');
    res.json({ message: 'Xóa nhạc cụ thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM view_instrument_status');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getStatus };
