import mysql, { Pool } from "mysql2/promise";

let pool: Pool | null = null;

export function getMysqlPool() {
  if (pool) return pool;
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) return null;
  pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT ? Number(MYSQL_PORT) : 3306,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD ?? undefined,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
}

export async function ensureSchema() {
  const p = getMysqlPool();
  if (!p) return false;
  await p.query(`CREATE TABLE IF NOT EXISTS wp_manager_sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL UNIQUE,
    api_key VARCHAR(128) NOT NULL,
    last_seen DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  return true;
}
