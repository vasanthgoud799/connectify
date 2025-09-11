import mongoose from "mongoose";
import { env } from "../config/env";

let isConnecting = false;
let hasConnected = false;
let lastErrorMessage: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let attempts = 0;

export function isMongoConnected() {
  return hasConnected && mongoose.connection.readyState === 1;
}

export function getMongoStatus() {
  return {
    connected: isMongoConnected(),
    lastError: lastErrorMessage,
  } as const;
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  const delay = Math.min(30000, 1000 * Math.pow(2, attempts));
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    attempts += 1;
    await connectMongo();
  }, delay);
  console.warn(`[mongo] Scheduling reconnect in ${Math.round(delay / 1000)}s`);
}

export async function connectMongo(): Promise<typeof mongoose | null> {
  if (hasConnected) return mongoose;
  if (isConnecting) return mongoose;
  if (!env.MONGO_URI) {
    console.warn("[mongo] MONGO_URI is not set. Skipping MongoDB connection.");
    lastErrorMessage = "MONGO_URI not set";
    return null;
  }
  try {
    isConnecting = true;
    mongoose.set('bufferCommands', false);
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    } as any);
    hasConnected = true;
    attempts = 0;
    lastErrorMessage = null;
    console.log("[mongo] Connected to MongoDB");
    mongoose.connection.on('error', (e) => {
      lastErrorMessage = e?.message || String(e);
      console.error('[mongo] connection error', e);
    });
    mongoose.connection.on('disconnected', () => {
      hasConnected = false;
      console.warn('[mongo] Disconnected');
      scheduleReconnect();
    });
    return mongoose;
  } catch (err: any) {
    const msg = err?.message || String(err);
    lastErrorMessage = msg;
    console.error("[mongo] Failed to connect to MongoDB:", err);
    scheduleReconnect();
    return null;
  } finally {
    isConnecting = false;
  }
}
