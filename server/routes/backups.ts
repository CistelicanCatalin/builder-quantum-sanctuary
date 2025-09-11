import express from "express";
import { getMysqlPool } from "../db/mysql";
import type { RequestHandler } from "express";
import { createBackupArchive, deleteBackupFile } from "../utils/backup";
import path from "path";
import { promises as fs } from "fs";

export const backupsRouter = express.Router();

// Obține toate backup-urile
backupsRouter.get("/", (async (_req, res) => {
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const [rows] = await pool.query(
      `SELECT b.*, s.url as site_url 
       FROM wp_manager_backups b 
       JOIN wp_manager_sites s ON b.site_id = s.id 
       ORDER BY b.created_at DESC`
    );
    return res.json({ items: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to fetch backups" });
  }
}) as RequestHandler);

// Obține toate backup-urile pentru un site
backupsRouter.get("/site/:siteId", (async (req, res) => {
  const { siteId } = req.params;
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM wp_manager_backups WHERE site_id = ? ORDER BY created_at DESC",
      [siteId]
    );
    return res.json({ items: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to fetch backups" });
  }
}) as RequestHandler);

// Creează un backup manual
backupsRouter.post("/", (async (req, res) => {
  const { site_id, type = 'full', retention_days = 30 } = req.body;
  if (!site_id) {
    return res.status(400).json({ error: "Missing site_id" });
  }

  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    // Creăm înregistrarea pentru backup
    const [result]: any = await pool.query(
      `INSERT INTO wp_manager_backups 
       (site_id, type, status, retention_days, is_manual) 
       VALUES (?, ?, 'pending', ?, TRUE)`,
      [site_id, type, retention_days]
    );
    
    // Începem procesul de backup în background
    createBackupArchive(result.insertId).catch(console.error);
    
    const [rows]: any = await pool.query(
      "SELECT * FROM wp_manager_backups WHERE id = ?",
      [result.insertId]
    );
    
    return res.status(201).json({ item: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to create backup" });
  }
}) as RequestHandler);

// Șterge un backup
backupsRouter.delete("/:id", (async (req, res) => {
  const { id } = req.params;
  
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    // Mai întâi ștergem fișierul fizic
    await deleteBackupFile(parseInt(id));
    
    // Apoi ștergem înregistrarea din baza de date
    await pool.query("DELETE FROM wp_manager_backups WHERE id = ?", [id]);
    
    return res.json({ status: "ok" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to delete backup" });
  }
}) as RequestHandler);

// Obține toate programările de backup
backupsRouter.get("/schedule", (async (_req, res) => {
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const [rows] = await pool.query(
      `SELECT bs.*, s.url as site_url 
       FROM wp_manager_backup_schedules bs 
       JOIN wp_manager_sites s ON bs.site_id = s.id 
       ORDER BY bs.next_run ASC`
    );
    return res.json({ items: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to fetch backup schedules" });
  }
}) as RequestHandler);

// Obține programările de backup pentru un site specific
backupsRouter.get("/schedule/site/:siteId", (async (req, res) => {
  const { siteId } = req.params;
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM wp_manager_backup_schedules WHERE site_id = ? ORDER BY next_run ASC",
      [siteId]
    );
    return res.json({ items: rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to fetch backup schedules" });
  }
}) as RequestHandler);

// Șterge o programare de backup
backupsRouter.delete("/schedule/:id", (async (req, res) => {
  const { id } = req.params;
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    await pool.query("DELETE FROM wp_manager_backup_schedules WHERE id = ?", [id]);
    return res.json({ status: "ok" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to delete backup schedule" });
  }
}) as RequestHandler);

// Actualizează o programare de backup
backupsRouter.put("/schedule/:id", (async (req, res) => {
  const { id } = req.params;
  const {
    type,
    frequency,
    time_of_day,
    day_of_week,
    day_of_month,
    retention_days,
    is_active
  } = req.body;

  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    // Calculăm următoarea rulare
    const nextRun = calculateNextRun(frequency, time_of_day, day_of_week, day_of_month);

    await pool.query(
      `UPDATE wp_manager_backup_schedules 
       SET type = ?, frequency = ?, time_of_day = ?, 
           day_of_week = ?, day_of_month = ?, retention_days = ?,
           is_active = ?, next_run = ?
       WHERE id = ?`,
      [type, frequency, time_of_day, day_of_week, day_of_month, retention_days, is_active, nextRun, id]
    );

    const [rows] = await pool.query(
      "SELECT * FROM wp_manager_backup_schedules WHERE id = ?",
      [id]
    );

    return res.json({ item: Array.isArray(rows) ? rows[0] : rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to update schedule" });
  }
}) as RequestHandler);

// Rulează manual o programare de backup
backupsRouter.post("/schedule/:id/run", (async (req, res) => {
  const { id } = req.params;
  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    // Obținem detaliile programării
    const [schedules]: any = await pool.query(
      "SELECT * FROM wp_manager_backup_schedules WHERE id = ?",
      [id]
    );

    if (!schedules.length) {
      return res.status(404).json({ error: "Backup schedule not found" });
    }

    const schedule = schedules[0];

    // Creăm un backup manual bazat pe configurația programării
    const [result]: any = await pool.query(
      `INSERT INTO wp_manager_backups 
       (site_id, type, status, retention_days, is_manual) 
       VALUES (?, ?, 'pending', ?, TRUE)`,
      [schedule.site_id, schedule.type, schedule.retention_days]
    );
    
    // Începem procesul de backup în background
    createBackupArchive(result.insertId).catch(console.error);
    
    const [rows]: any = await pool.query(
      "SELECT * FROM wp_manager_backups WHERE id = ?",
      [result.insertId]
    );
    
    // Actualizăm last_run pentru programare
    await pool.query(
      "UPDATE wp_manager_backup_schedules SET last_run = NOW() WHERE id = ?",
      [id]
    );
    
    return res.status(201).json({ item: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to run backup schedule" });
  }
}) as RequestHandler);

// Descarcă un backup
backupsRouter.get("/download/:filename", (async (req, res) => {
  const { filename } = req.params;
  const backupPath = path.join(process.cwd(), "storage", "backups", filename);
  
  try {
    // Verificăm dacă fișierul există
    await fs.access(backupPath);
    // Trimitem fișierul
    res.download(backupPath);
  } catch (error) {
    res.status(404).json({ error: "Backup file not found" });
  }
}) as RequestHandler);

backupsRouter.post("/schedule", (async (req, res) => {
  const { 
    site_id, 
    type = 'full',
    frequency,
    time_of_day,
    day_of_week = null,
    day_of_month = null,
    retention_days = 30
  } = req.body;
  
  if (!site_id || !frequency || !time_of_day) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const pool = getMysqlPool();
  if (!pool) return res.status(500).json({ error: "Database not configured" });

  try {
    // Calculăm următoarea rulare
    const nextRun = calculateNextRun(frequency, time_of_day, day_of_week, day_of_month);
    
    const [result]: any = await pool.query(
      `INSERT INTO wp_manager_backup_schedules 
       (site_id, type, frequency, time_of_day, day_of_week, day_of_month, retention_days, next_run) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [site_id, type, frequency, time_of_day, day_of_week, day_of_month, retention_days, nextRun]
    );
    
    const [rows]: any = await pool.query(
      "SELECT * FROM wp_manager_backup_schedules WHERE id = ?",
      [result.insertId]
    );
    
    return res.status(201).json({ item: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to create schedule" });
  }
}) as RequestHandler);

function calculateNextRun(
  frequency: string,
  timeOfDay: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null
): Date {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const result = new Date(now);
  
  result.setHours(hours, minutes, 0, 0);
  
  if (result <= now) {
    result.setDate(result.getDate() + 1);
  }
  
  switch (frequency) {
    case 'weekly':
      if (dayOfWeek !== null) {
        while (result.getDay() !== dayOfWeek) {
          result.setDate(result.getDate() + 1);
        }
      }
      break;
      
    case 'monthly':
      if (dayOfMonth !== null) {
        result.setDate(dayOfMonth);
        if (result <= now) {
          result.setMonth(result.getMonth() + 1);
        }
      }
      break;
  }
  
  return result;
}
