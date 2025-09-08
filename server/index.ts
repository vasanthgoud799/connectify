import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { connectMongo } from "./db/mongo";
import authRoutes from "./routes/auth";
import friendsRoutes from "./routes/friends";
import channelsRoutes from "./routes/channels";
import usersRoutes from "./routes/users";

export function createServer() {
  const app = express();

  // Middleware
  app.set("trust proxy", 1);

  // ❌ Removed helmet completely
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Headers for media permissions
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(self)");
    next();
  });

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // App Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/friends", friendsRoutes);
  app.use("/api/channels", channelsRoutes);
  app.use("/api/users", usersRoutes);

  // Initialize DB (non-blocking)
  void connectMongo();

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err?.status || 500;
    const message = err?.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  return app;
}
