const { getPool, sql } = require('../config/db');

// ── Get All Borrows ─────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM view_borrow_history');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Borrow Instrument ───────────────────────────────────────
const borrowInstrument = async (req, res) => {
  try {
    const { instrument_id, user_id, expected_return, deposit, notes, condition_rating, condition_notes } = req.body;
    if (!instrument_id || !user_id || !expected_return)
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });

    const pool = getPool();

    // Check instrument available
    const instrResult = await pool.request()
      .input('id', sql.Int, instrument_id)
      .query("SELECT * FROM instruments WHERE id=@id AND status='available'");
    if (!instrResult.recordset[0])
      return res.status(409).json({ message: 'Nhạc cụ không sẵn sàng để cho mượn' });

    const instr = instrResult.recordset[0];
    const hours = (new Date(expected_return) - new Date()) / (1000 * 60 * 60);
    const total_price = Math.max(0, hours) * parseFloat(instr.rental_price);

    // Ghi nhận tình trạng TRƯỚC khi mượn
    const condResult = await pool.request()
      .input('instrument_id',    sql.Int,      instrument_id)
      .input('recorded_by',      sql.Int,      req.user.id)
      .input('condition_type',   sql.NVarChar, 'before_borrow')
      .input('condition_rating', sql.NVarChar, condition_rating || 'good')
      .input('notes',            sql.NVarChar, condition_notes || null)
      .query(`INSERT INTO instrument_conditions (instrument_id, recorded_by, condition_type, condition_rating, notes)
              OUTPUT INSERTED.id
              VALUES (@instrument_id, @recorded_by, @condition_type, @condition_rating, @notes)`);
    const pre_condition_id = condResult.recordset[0].id;

    // Tạo borrow transaction
    await pool.request()
      .input('instrument_id',    sql.Int,         instrument_id)
      .input('user_id',          sql.Int,         user_id)
      .input('staff_id',         sql.Int,         req.user.id)
      .input('expected_return',  sql.DateTime,    new Date(expected_return))
      .input('total_price',      sql.Decimal(10,2), total_price)
      .input('deposit',          sql.Decimal(10,2), deposit || 0)
      .input('pre_condition_id', sql.Int,         pre_condition_id)
      .input('notes',            sql.NVarChar,    notes || null)
      .query(`INSERT INTO borrow_transactions
              (instrument_id, user_id, staff_id, expected_return, total_price, deposit, pre_condition_id, notes)
              VALUES (@instrument_id, @user_id, @staff_id, @expected_return, @total_price, @deposit, @pre_condition_id, @notes)`);

    // Cập nhật trạng thái nhạc cụ
    await pool.request()
      .input('id', sql.Int, instrument_id)
      .query("UPDATE instruments SET status='borrowed', updated_at=GETDATE() WHERE id=@id");

    res.status(201).json({ message: '✅ Mượn nhạc cụ thành công', total_price });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── Return Instrument ───────────────────────────────────────
const returnInstrument = async (req, res) => {
  try {
    const { borrow_id, condition_rating, condition_notes, damage_fee, notes } = req.body;
    if (!borrow_id) return res.status(400).json({ message: 'borrow_id là bắt buộc' });

    const pool = getPool();

    // Get borrow info
    const borrowResult = await pool.request()
      .input('id', sql.Int, borrow_id)
      .query("SELECT * FROM borrow_transactions WHERE id=@id AND status='borrowed'");
    const borrow = borrowResult.recordset[0];
    if (!borrow) return res.status(404).json({ message: 'Không tìm thấy giao dịch mượn' });

    // Tính phí trễ
    const now = new Date();
    const expected = new Date(borrow.expected_return);
    const lateHours = Math.max(0, (now - expected) / (1000 * 60 * 60));
    const late_fee = lateHours > 0 ? lateHours * parseFloat(borrow.total_price) * 0.1 : 0;

    // Ghi nhận tình trạng SAU khi trả
    const condResult = await pool.request()
      .input('instrument_id',    sql.Int,      borrow.instrument_id)
      .input('recorded_by',      sql.Int,      req.user.id)
      .input('condition_type',   sql.NVarChar, 'after_return')
      .input('condition_rating', sql.NVarChar, condition_rating || 'good')
      .input('notes',            sql.NVarChar, condition_notes || null)
      .query(`INSERT INTO instrument_conditions (instrument_id, recorded_by, condition_type, condition_rating, notes)
              OUTPUT INSERTED.id
              VALUES (@instrument_id, @recorded_by, @condition_type, @condition_rating, @notes)`);
    const post_condition_id = condResult.recordset[0].id;

    const dmg_fee = parseFloat(damage_fee || 0);
    const refund = Math.max(0, parseFloat(borrow.deposit) - dmg_fee - late_fee);

    // Tạo return transaction
    await pool.request()
      .input('borrow_id',         sql.Int,         borrow_id)
      .input('staff_id',          sql.Int,         req.user.id)
      .input('post_condition_id', sql.Int,         post_condition_id)
      .input('damage_fee',        sql.Decimal(10,2), dmg_fee)
      .input('late_fee',          sql.Decimal(10,2), late_fee)
      .input('refund_deposit',    sql.Decimal(10,2), refund)
      .input('notes',             sql.NVarChar,    notes || null)
      .query(`INSERT INTO return_transactions
              (borrow_id, staff_id, post_condition_id, damage_fee, late_fee, refund_deposit, notes)
              VALUES (@borrow_id, @staff_id, @post_condition_id, @damage_fee, @late_fee, @refund_deposit, @notes)`);

    // Cập nhật borrow status
    await pool.request()
      .input('id', sql.Int, borrow_id)
      .query("UPDATE borrow_transactions SET status='returned', actual_return=GETDATE(), updated_at=GETDATE() WHERE id=@id");

    // Cập nhật instrument available
    await pool.request()
      .input('id', sql.Int, borrow.instrument_id)
      .query("UPDATE instruments SET status='available', updated_at=GETDATE() WHERE id=@id");

    res.json({ message: '✅ Trả nhạc cụ thành công', late_fee, damage_fee: dmg_fee, refund });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports = { getAll, borrowInstrument, returnInstrument };
