import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import { sitesRouter } from "./routes/sites";
import { settingsRouter } from "./routes/settings";
import { uptimeRouter, startUptimeMonitor } from "./routes/uptime";
import { backupsRouter } from "./routes/backups";
import { executeScheduledBackups, cleanupExpiredBackups } from "./utils/backup";
import { runMigrations } from "./db/migrations";
import { checkFilePermissions } from "./routes/security";
import { authRouter, sessionConfig, requireAuth } from "./routes/auth";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Session middleware
  app.use(session(sessionConfig));
  
  // Servește fișierele de backup
  app.use("/backups", express.static(path.join(process.cwd(), "storage", "backups")));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes (no auth required)
  app.use("/api/auth", authRouter);

  // Protected routes (require authentication)
  app.use("/api/sites", requireAuth, sitesRouter);
  app.use("/api/settings", requireAuth, settingsRouter);
  app.use("/api/uptime", requireAuth, uptimeRouter);
  app.use("/api/backups", requireAuth, backupsRouter);
  
  // Security
  app.post("/api/security/check-permissions", requireAuth, checkFilePermissions);

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
