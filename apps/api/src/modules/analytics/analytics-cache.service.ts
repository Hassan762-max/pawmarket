import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

type Entry = { value: string; expiresAt: number };

@Injectable()
export class AnalyticsCacheService implements OnModuleInit, OnModuleDestroy {
  private memory = new Map<string, Entry>();
  private redis: {
    get: (k: string) => Promise<string | null>;
    set: (k: string, v: string, mode: string, sec: number) => Promise<unknown>;
    quit: () => Promise<unknown>;
  } | null = null;
  private backend: "redis" | "memory" = "memory";

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.log("[analytics-cache] REDIS_URL unset — memory TTL cache");
      return;
    }
    try {
      const mod = await import("ioredis").catch(() => null);
      if (!mod) {
        console.log("[analytics-cache] ioredis not installed — memory TTL cache");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Redis = (mod as any).default ?? mod;
      const client = new Redis(url);
      await client.ping();
      this.redis = client;
      this.backend = "redis";
      console.log("[analytics-cache] using Redis");
    } catch {
      console.log("[analytics-cache] Redis unavailable — memory TTL cache");
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  getBackend() {
    return this.backend;
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (this.redis) {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const hit = this.memory.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(hit.value) as T;
  }

  async setJson(key: string, value: unknown, ttlSeconds = 60) {
    const raw = JSON.stringify(value);
    if (this.redis) {
      await this.redis.set(key, raw, "EX", ttlSeconds);
      return;
    }
    this.memory.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}
