import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { sitesRouter } from "./routes/sites";
import { settingsRouter } from "./routes/settings";
import { uptimeRouter, startUptimeMonitor } from "./routes/uptime";
import { backupsRouter } from "./routes/backups";
import { executeScheduledBackups, cleanupExpiredBackups } from "./utils/backup";
import { runMigrations } from "./db/migrations";
import { checkFilePermissions } from "./routes/security";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Servește fișierele de backup
  app.use("/backups", express.static(path.join(process.cwd(), "storage", "backups")));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Sites management
  app.use("/api/sites", sitesRouter);
  // Settings
  app.use("/api/settings", settingsRouter);
  // Uptime monitoring
  app.use("/api/uptime", uptimeRouter);
  // Backups
  app.use("/api/backups", backupsRouter);
  
  // Security
  app.post("/api/security/check-permissions", checkFilePermissions);

  // Start the uptime monitor and backup scheduler
  startUptimeMonitor();
  
  // Run backup scheduler every minute
  setInterval(async () => {
    try {
      await executeScheduledBackups();
      await cleanupExpiredBackups();
    } catch (error) {
      console.error("Error in backup scheduler:", error);
    }
  }, 60000);

  // No need to serve static files or handle client routes in development
  // Vite will handle that for us

  return app;
}
