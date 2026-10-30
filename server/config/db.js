const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];
for (const p of envPaths) {
  dotenv.config({ path: p });
}

const isPostgres = Boolean(
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))
);

let pool;
let isPostgresMode = false;

if (isPostgres) {
  const { Pool } = require('pg');
  isPostgresMode = true;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  console.log('[DATABASE] Initialized Supabase PostgreSQL connection pool.');
  pool.getConnection = async () => {
    const client = await pool.connect();
    return {
      execute: async (sql, params = []) => {
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await client.query(pgSql, params);
        return [res.rows, res.fields];
      },
      query: async (sql, params = []) => {
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await client.query(pgSql, params);
        return [res.rows, res.fields];
      },
      beginTransaction: async () => client.query('BEGIN'),
      commit: async () => client.query('COMMIT'),
      rollback: async () => client.query('ROLLBACK'),
      release: () => client.release()
    };
  };
} else {
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_erp',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
  console.log('[DATABASE] Initialized MySQL connection pool.');
}

/**
 * Execute a parameterized SQL query safely
 * Supports both PostgreSQL ($1, $2, ...) and MySQL (?) syntax seamlessly.
 * @param {string} sql Parameterized query string
 * @param {Array} params Parameter values
 * @returns {Promise<[Array, Object]>} Returns [rows, fields]
 */
async function query(sql, params = []) {
  if (isPostgresMode) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pool.query(pgSql, params);
    return [res.rows, res.fields];
  } else {
    return pool.execute(sql, params);
  }
}

/**
 * Check if the database connection is alive
 * @returns {Promise<{ connected: boolean, message: string }>}
 */
async function checkDbConnection() {
  try {
    if (isPostgresMode) {
      await pool.query('SELECT 1');
      return {
        connected: true,
        message: 'Supabase PostgreSQL connection established successfully.'
      };
    } else {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return {
        connected: true,
        message: 'MySQL connection established successfully.'
      };
    }
  } catch (err) {
    return {
      connected: false,
      message: `Database connection unavailable: ${err.message}.`
    };
  }
}

module.exports = {
  pool,
  query,
  checkDbConnection,
  isPostgresMode
};
