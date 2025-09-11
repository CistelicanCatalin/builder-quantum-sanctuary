import express from "express";
import { getMysqlPool } from "../db/mysql";
import type { RequestHandler } from "express";
import type { UptimeCheck, UptimeCheckHistoryItem } from "@shared/api";

export const uptimeRouter = express.Router();

// Trigger a manual check
uptimeRouter.post("/:id/check", (async (req, res) => {
  const { id } = req.params;
  
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    // Get the check details
    const [checks]: any = await pool.query(
      "SELECT * FROM wp_manager_uptime_checks WHERE id = ?",
      [id]
    );
    
    if (!checks.length) {
      return res.status(404).json({ error: "Check not found" });
    }

    // Perform the check
    await performUptimeCheck(checks[0]);

    // Get the updated check details
    const [updated]: any = await pool.query(
      "SELECT * FROM wp_manager_uptime_checks WHERE id = ?",
      [id]
    );
    
    return res.json({ item: updated[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to perform check" });
  }
}) as RequestHandler);

// Get all uptime checks for a site
uptimeRouter.get("/site/:siteId", (async (req, res) => {
  const { siteId } = req.params;
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM wp_manager_uptime_checks WHERE site_id = ? ORDER BY created_at DESC",
      [siteId]
    );
    return res.json({ items: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to fetch checks" });
  }
}) as RequestHandler);

// Create a new uptime check
uptimeRouter.post("/", (async (req, res) => {
  const { site_id, url, check_interval } = req.body;
  if (!site_id || !url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const [result]: any = await pool.query(
      "INSERT INTO wp_manager_uptime_checks (site_id, url, check_interval) VALUES (?, ?, ?)",
      [site_id, url, check_interval ?? 300]
    );
    
    const [rows]: any = await pool.query(
      "SELECT * FROM wp_manager_uptime_checks WHERE id = ?",
      [result.insertId]
    );
    
    return res.status(201).json({ item: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to create check" });
  }
}) as RequestHandler);

// Update an uptime check
uptimeRouter.patch("/:id", (async (req, res) => {
  const { id } = req.params;
  const { check_interval, is_active } = req.body;
  
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (check_interval !== undefined) {
      updates.push("check_interval = ?");
      values.push(check_interval);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }

    if (!updates.length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    await pool.query(
      `UPDATE wp_manager_uptime_checks SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [rows]: any = await pool.query(
      "SELECT * FROM wp_manager_uptime_checks WHERE id = ?",
      [id]
    );
    
    return res.json({ item: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to update check" });
  }
}) as RequestHandler);

// Delete an uptime check
uptimeRouter.delete("/:id", (async (req, res) => {
  const { id } = req.params;
  
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    await pool.query("DELETE FROM wp_manager_uptime_checks WHERE id = ?", [id]);
    return res.json({ status: "ok" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to delete check" });
  }
}) as RequestHandler);

// Get history for a check
uptimeRouter.get("/:id/history", (async (req, res) => {
  const { id } = req.params;
  const { limit } = req.query;
  
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM wp_manager_uptime_history WHERE check_id = ? ORDER BY checked_at DESC LIMIT ?",
      [id, limit ? parseInt(limit as string, 10) : 100]
    );
    return res.json({ items: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to fetch history" });
  }
}) as RequestHandler);

// Function to perform the actual uptime check
async function performUptimeCheck(check: UptimeCheck): Promise<void> {
  const pool = getMysqlPool();
  if (!pool) return;

  try {
    const startTime = Date.now();
    const response = await fetch(check.url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "WP-Manager-Uptime-Monitor/1.0" }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Record the check result
    await pool.query(
      "INSERT INTO wp_manager_uptime_history (check_id, status_code, response_time) VALUES (?, ?, ?)",
      [check.id, response.status, responseTime]
    );

    // Update the check's last status
    await pool.query(
      "UPDATE wp_manager_uptime_checks SET last_check = NOW(), last_status = ?, response_time = ? WHERE id = ?",
      [response.status, responseTime, check.id]
    );
  } catch (error) {
    // Record the failed check
    await pool.query(
      "INSERT INTO wp_manager_uptime_history (check_id, status_code, response_time) VALUES (?, NULL, NULL)",
      [check.id]
    );

    // Update the check's last status
    await pool.query(
      "UPDATE wp_manager_uptime_checks SET last_check = NOW(), last_status = NULL, response_time = NULL WHERE id = ?",
      [check.id]
    );
  }
}

// Start the uptime monitoring system
let monitorInterval: NodeJS.Timeout | null = null;

export function startUptimeMonitor() {
  if (monitorInterval) return;

  monitorInterval = setInterval(async () => {
    const pool = getMysqlPool();
    if (!pool) return;

    try {
      // Get all active checks that are due for checking
      const [checks]: any = await pool.query(
        `SELECT * FROM wp_manager_uptime_checks 
         WHERE is_active = TRUE 
         AND (last_check IS NULL OR DATE_ADD(last_check, INTERVAL check_interval SECOND) <= NOW())`
      );

      // Perform checks in parallel
      await Promise.all((checks as UptimeCheck[]).map(performUptimeCheck));
    } catch (error) {
      console.error("Error in uptime monitor:", error);
    }
  }, 10000); // Check every 10 seconds for due checks
}

export function stopUptimeMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
