import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: false,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    headers:
      mode === "development"
        ? {
            "Content-Security-Policy": "",
            "Permissions-Policy": "camera=(self), microphone=(self)",
          }
        : {},
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
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      const { createServer } = await import("./server/index.ts");
      const app = createServer();

      server.middlewares.use(app);

      if (server.httpServer) {
        const { setupSocket } = await import("./server/socket/index.ts");
        setupSocket(server.httpServer);
      }
    },
  };
}
