import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { sitesRouter } from "./routes/sites";
import { settingsRouter } from "./routes/settings";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  return app;
}
