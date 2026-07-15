const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "meditrack123",
  database: process.env.PGDATABASE || "db_meditrack",
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      edad INT,
      nss TEXT UNIQUE,
      alergias TEXT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registros_medicos (
      id SERIAL PRIMARY KEY,
      paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
      fecha TIMESTAMP DEFAULT NOW(),
      diagnostico TEXT,
      receta TEXT,
      doctor TEXT,
      consultorio TEXT
    );
  `);
  await pool.query(`
    ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT NOW();
  `);
  console.log("[db] tablas listas");
}
module.exports = { pool, initDb };
