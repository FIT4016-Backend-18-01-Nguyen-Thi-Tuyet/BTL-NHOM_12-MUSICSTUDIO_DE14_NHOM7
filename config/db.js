const sql = require("mssql");
require("dotenv").config();

let pool; // 🔥 giữ pool global

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    instanceName: process.env.DB_INSTANCE,
    encrypt: false,
    trustServerCertificate: true
  }
};

// Kết nối DB
const connectDB = async () => {
  try {
    pool = await sql.connect(config);
    console.log("✅ Connected to SQL Server");
    return pool;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
};

// Lấy pool đã connect
const getPool = () => {
  if (!pool) {
    throw new Error("Database chưa connect!");
  }
  return pool;
};

module.exports = { connectDB, getPool, sql };