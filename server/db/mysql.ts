import mysql, { Pool } from "mysql2/promise";

let pool: Pool | null = null;

export type MysqlConfig = {
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
};

export function setMysqlEnv(cfg: MysqlConfig) {
  process.env.MYSQL_HOST = cfg.host;
  process.env.MYSQL_PORT = String(cfg.port ?? 3306);
  process.env.MYSQL_USER = cfg.user;
  process.env.MYSQL_PASSWORD = cfg.password ?? "";
  process.env.MYSQL_DATABASE = cfg.database;
  // Reset pool so new config takes effect
  pool = null;
}

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

export async function testConnection(cfg: MysqlConfig) {
  const temp = mysql.createPool({
    host: cfg.host,
    port: cfg.port ?? 3306,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 1,
  });
  try {
    const [rows] = await temp.query("SELECT 1 AS ok");
    await temp.end();
    return { ok: true, rows } as const;
  } catch (e) {
    await temp.end().catch(() => {});
    return { ok: false, error: e } as const;
  }
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
