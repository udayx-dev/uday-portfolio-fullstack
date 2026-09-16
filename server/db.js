const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  // We don't crash the whole process here — server.js decides how to
  // degrade (contact form / admin dashboard become unavailable but the
  // static site and chatbot's general Q&A still work).
  console.warn('⚠️  DATABASE_URL is not set — anything that touches the database will fail until it is configured.');
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
    })
  : null;

pool?.on('error', (err) => {
  // Idle client errors (e.g. connection dropped by the DB host) must never
  // crash the process — just log and let the pool recover.
  console.error('Unexpected Postgres pool error:', err.message);
});

async function ensureSchema() {
  if (!pool) return;
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
  await pool.query(sql);
}

function isConfigured() {
  return !!pool;
}

async function query(text, params) {
  if (!pool) {
    const err = new Error('DATABASE_NOT_CONFIGURED');
    err.code = 'DATABASE_NOT_CONFIGURED';
    throw err;
  }
  return pool.query(text, params);
}

module.exports = { pool, query, ensureSchema, isConfigured };
