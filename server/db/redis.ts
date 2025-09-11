import Redis from "ioredis";
import { env } from "../config/env";

export type PresenceStatus = "online" | "offline" | "away" | "dnd";

class MemoryRedisLike {
  private store = new Map<string, string>();
  async set(key: string, value: string) {
    this.store.set(key, value);
  }
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async del(key: string) {
    this.store.delete(key);
  }
  async expire(_key: string, _sec: number) {
    // no-op for memory
  }
}

let redis: Redis | MemoryRedisLike | null = null;

export function getRedis() {
  if (redis) return redis;

  if (env.REDIS_URL) {
    try {
      const client = new Redis(env.REDIS_URL, { tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined } as any);
      client.on("ready", () => console.log("[redis] connected"));
      client.on("error", (e) => console.error("[redis] error", e));
      redis = client; // Always use the same backend to avoid inconsistent reads/writes
    } catch (e: any) {
      console.warn("[redis] initialization failed, using in-memory fallback:", e?.message || e);
      redis = new MemoryRedisLike();
    }
  } else {
    console.warn("[redis] REDIS_URL not set. Using in-memory fallback.");
    redis = new MemoryRedisLike();
  }

  return redis!;
}
