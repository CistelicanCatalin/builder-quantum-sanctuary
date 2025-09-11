import type { RequestHandler } from "express";
import express from "express";
import { ensureSchema, getMysqlPool } from "../db/mysql";

export interface SiteRow {
  id: number;
  url: string;
  api_key: string;
  last_seen: string | null;
  created_at: string;
}

const memory: SiteRow[] = [];
let initialized = false;

async function init() {
  if (initialized) return;
  try {
    await ensureSchema();
  } catch {}
  initialized = true;
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    u.pathname = u.pathname.replace(/\/$/, "");
    return u.toString();
  } catch {
    return url;
  }
}

export const sitesRouter = express.Router();

sitesRouter.get("/", (async (_req, res) => {
  await init();
  const pool = getMysqlPool();
  if (pool) {
    const [rows] = await pool.query(
      "SELECT id, url, last_seen, created_at FROM wp_manager_sites ORDER BY id DESC",
    );
    return res.json({ items: rows });
  }
  return res.json({ items: memory.map(({ api_key, ...r }) => r) });
}) as RequestHandler);

sitesRouter.post("/", (async (req, res) => {
  await init();
  const { url, apiKey } = req.body ?? {};
  if (!url || !apiKey)
    return res.status(400).json({ error: "Missing url or apiKey" });
  const normalized = normalizeUrl(url);

  // Probe remote status (non-blocking on failure)
  let lastSeen: string | null = null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(
      `${normalized.replace(/\/$/, "")}/wp-json/wpm/v1/status`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      },
    );
    clearTimeout(t);
    if (resp.ok) {
      lastSeen = new Date().toISOString().slice(0, 19).replace("T", " ");
    }
  } catch {}

  const pool = getMysqlPool();
  try {
    if (pool) {
      await pool.query(
        "INSERT INTO wp_manager_sites (url, api_key, last_seen) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE api_key=VALUES(api_key), last_seen=VALUES(last_seen)",
        [normalized, apiKey, lastSeen],
      );
      const [rows] = await pool.query(
        "SELECT id, url, last_seen, created_at FROM wp_manager_sites WHERE url=?",
        [normalized],
      );
      return res
        .status(201)
        .json({ item: Array.isArray(rows) ? rows[0] : rows });
    } else {
      const existing = memory.find((s) => s.url === normalized);
      if (existing) {
        existing.api_key = apiKey;
        existing.last_seen = lastSeen;
      } else {
        memory.unshift({
          id: memory.length + 1,
          url: normalized,
          api_key: apiKey,
          last_seen: lastSeen,
          created_at: new Date().toISOString(),
        });
      }
      const { api_key, ...item } = memory[0];
      return res.status(201).json({ item });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to save" });
  }
}) as RequestHandler);
