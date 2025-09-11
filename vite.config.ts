import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

export default defineConfig({
  server: {
    fs: {
      strict: false, // Permite accesul la orice fișier din sistem
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});

function expressPlugin(): Plugin {
  let app: any = null;

  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      if (!app) {
        app = await createServer();
      }
      
      // Add logging middleware
      //server.middlewares.use((req, _res, next) => {
      //  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      //  next();
      //});

      // Use Express app
      server.middlewares.use(app);
    },
  };
}
