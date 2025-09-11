import type { RequestHandler } from "express";
import express from "express";
import { z } from "zod";
import path from "path";
import { promises as fs } from "fs";
import {
  ensureSchema,
  setMysqlEnv,
  testConnection,
  type MysqlConfig,
} from "../db/mysql";
import { runMigrations } from "../db/migrations";

const SETTINGS_DIR = path.join(process.cwd(), "server", ".runtime");
const MYSQL_FILE = path.join(SETTINGS_DIR, "mysql.json");

async function readSettings(): Promise<MysqlConfig | null> {
  try {
    const raw = await fs.readFile(MYSQL_FILE, "utf8");
    const json = JSON.parse(raw);
    return json;
  } catch {
    return null;
  }
}

async function writeSettings(cfg: MysqlConfig) {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  await fs.writeFile(MYSQL_FILE, JSON.stringify(cfg), "utf8");
}

const bodySchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string(),
  database: z.string().min(1),
}).transform((data) => ({
  host: data.host,
  port: data.port,
  user: data.user,
  password: data.password,
  database: data.database,
} as MysqlConfig));

export const settingsRouter = express.Router();

settingsRouter.get("/mysql", (async (_req, res) => {
  const current = await readSettings();
  const masked = current
    ? {
        host: current.host,
        port: current.port ?? 3306,
        user: current.user,
        database: current.database,
        hasPassword: Boolean(current.password),
      }
    : null;
  res.json({ settings: masked });
}) as RequestHandler);

settingsRouter.post("/mysql", (async (req, res) => {
  const parsed = bodySchema.safeParse(req.body ?? {});
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const cfg = parsed.data;

  const test = await testConnection(cfg);
  if (!test.ok) {
    return res
      .status(400)
      .json({
        error: "Nu mă pot conecta la MySQL. Verifică datele.",
        details: String((test as any).error?.message ?? ""),
      });
  }

  await writeSettings(cfg);
  setMysqlEnv(cfg);
  
  try {
    await runMigrations();
    console.log('Database migrations completed successfully');
    await ensureSchema();
    res.json({ status: "ok" });
  } catch (error) {
    console.error('Failed to run database migrations:', error);
    res.status(500).json({ 
      error: "Failed to initialize database", 
      details: String((error as any)?.message ?? "") 
    });
  }
}) as RequestHandler);
