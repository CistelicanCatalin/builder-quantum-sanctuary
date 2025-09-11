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

// Fetch status from a specific site via the WP Manager Client plugin
sitesRouter.get("/:id/status", (async (req, res) => {
  await init();
  const { id } = req.params as { id: string };
  const pool = getMysqlPool();
  let url: string | null = null;
  let apiKey: string | null = null;
  try {
    if (pool) {
      const [rows]: any = await pool.query(
        "SELECT url, api_key FROM wp_manager_sites WHERE id = ?",
        [id],
      );
      if (Array.isArray(rows) && rows.length > 0) {
        url = rows[0].url as string;
        apiKey = rows[0].api_key as string | null;
      }
    } else {
      const row = memory.find((s) => s.id === Number(id));
      if (row) {
        url = row.url;
        apiKey = row.api_key;
      }
    }
    if (!url || !apiKey) return res.status(404).json({ error: "Site not found" });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(
      `${url.replace(/\/$/, "")}/wp-json/wpm/v1/status`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Remote status failed (${resp.status})` });
    }
    const data = await resp.json();
    return res.json(data);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message ?? "Failed to fetch site status" });
  }
}) as RequestHandler);

// Toggle maintenance mode on a site via client plugin
sitesRouter.post("/:id/maintenance", (async (req, res) => {
  await init();
  const { id } = req.params as { id: string };
  const { enable } = (req.body ?? {}) as { enable?: boolean };
  if (typeof enable !== "boolean") return res.status(400).json({ error: "Missing enable boolean" });
  const pool = getMysqlPool();
  let url: string | null = null;
  let apiKey: string | null = null;
  if (pool) {
    const [rows]: any = await pool.query("SELECT url, api_key FROM wp_manager_sites WHERE id=?", [id]);
    if (Array.isArray(rows) && rows.length) {
      url = rows[0].url as string;
      apiKey = rows[0].api_key as string | null;
    }
  } else {
    const row = memory.find((s) => s.id === Number(id));
    if (row) { url = row.url; apiKey = row.api_key; }
  }
  if (!url || !apiKey) return res.status(404).json({ error: "Site not found" });
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/wp-json/wpm/v1/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ enable }),
    });
    if (!r.ok) return res.status(r.status).json({ error: `Remote maintenance failed (${r.status})` });
    const data = await r.json().catch(() => ({ status: "ok" }));
    return res.json(data);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message ?? "Failed to toggle maintenance" });
  }
}) as RequestHandler);

// Activate/Deactivate a plugin on a site via client plugin
sitesRouter.post("/:id/plugins/:action", (async (req, res) => {
  await init();
  const { id, action } = req.params as { id: string; action: string };
  const { file } = (req.body ?? {}) as { file?: string };
  if (!file) return res.status(400).json({ error: "Missing plugin file" });
  if (!["activate", "deactivate"].includes(action)) return res.status(400).json({ error: "Invalid action" });
  const pool = getMysqlPool();
  let url: string | null = null;
  let apiKey: string | null = null;
  if (pool) {
    const [rows]: any = await pool.query("SELECT url, api_key FROM wp_manager_sites WHERE id=?", [id]);
    if (Array.isArray(rows) && rows.length) {
      url = rows[0].url as string;
      apiKey = rows[0].api_key as string | null;
    }
  } else {
    const row = memory.find((s) => s.id === Number(id));
    if (row) { url = row.url; apiKey = row.api_key; }
  }
  if (!url || !apiKey) return res.status(404).json({ error: "Site not found" });
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/wp-json/wpm/v1/plugins/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ file }),
    });
    if (!r.ok) return res.status(r.status).json({ error: `Remote ${action} failed (${r.status})` });
    const data = await r.json().catch(() => ({ status: "ok" }));
    return res.json(data);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message ?? `Failed to ${action} plugin` });
  }
}) as RequestHandler);

// Update a plugin on a site via client plugin
sitesRouter.post("/:id/plugins/update", (async (req, res) => {
  await init();
  const { id } = req.params as { id: string };
  const { file } = (req.body ?? {}) as { file?: string };
  if (!file) return res.status(400).json({ error: "Missing plugin file" });
  const pool = getMysqlPool();
  let url: string | null = null;
  let apiKey: string | null = null;
  if (pool) {
    const [rows]: any = await pool.query("SELECT url, api_key FROM wp_manager_sites WHERE id=?", [id]);
    if (Array.isArray(rows) && rows.length) { url = rows[0].url as string; apiKey = rows[0].api_key as string | null; }
  } else {
    const row = memory.find((s) => s.id === Number(id));
    if (row) { url = row.url; apiKey = row.api_key; }
  }
  if (!url || !apiKey) return res.status(404).json({ error: "Site not found" });
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/wp-json/wpm/v1/plugins/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ file }),
    });
    if (!r.ok) return res.status(r.status).json({ error: `Remote update failed (${r.status})` });
    const data = await r.json().catch(() => ({ status: "ok" }));
    return res.json(data);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message ?? "Failed to update plugin" });
  }
}) as RequestHandler);

// Stats: total sites and how many were added in the last 7 days
sitesRouter.get("/stats", (async (_req, res) => {
  await init();
  const pool = getMysqlPool();
  if (pool) {
    const [[totalRow]]: any = await pool.query(
      "SELECT COUNT(*) AS total FROM wp_manager_sites",
    );
    const [[weekRow]]: any = await pool.query(
      "SELECT COUNT(*) AS addedThisWeek FROM wp_manager_sites WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)",
    );
    return res.json({ total: totalRow.total ?? 0, addedThisWeek: weekRow.addedThisWeek ?? 0 });
  }
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const addedThisWeek = memory.filter((s) => {
    const t = new Date(s.created_at).getTime();
    return !Number.isNaN(t) && now - t <= sevenDaysMs;
  }).length;
  return res.json({ total: memory.length, addedThisWeek });
}) as RequestHandler);

// Request one-click admin login URL from the client plugin
sitesRouter.post("/:id/admin-login", (async (req, res) => {
  await init();
  const { id } = req.params as { id: string };
  const pool = getMysqlPool();
  let url: string | null = null;
  let apiKey: string | null = null;
  if (pool) {
    const [rows]: any = await pool.query("SELECT url, api_key FROM wp_manager_sites WHERE id=?", [id]);
    if (Array.isArray(rows) && rows.length) {
      url = rows[0].url as string;
      apiKey = rows[0].api_key as string | null;
    }
  } else {
    const row = memory.find((s) => s.id === Number(id));
    if (row) { url = row.url; apiKey = row.api_key; }
  }
  if (!url || !apiKey) return res.status(404).json({ error: "Site not found" });
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/wp-json/wpm/v1/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({}),
    });
    if (!r.ok) return res.status(r.status).json({ error: `Remote admin-login failed (${r.status})` });
    const data = await r.json();
    // Expecting { url: "https://site/wp-login.php?...token..." }
    return res.json(data);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message ?? "Failed to request admin login" });
  }
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
