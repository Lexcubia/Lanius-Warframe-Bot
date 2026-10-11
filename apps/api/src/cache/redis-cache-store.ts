import { Redis } from 'ioredis';

import { MemoryCacheStore } from './memory-cache-store.js';
import type { CacheLookup, CacheStore } from './types.js';

/**
 * Redis 条目信封（保留 storedAt 以计算 age / stale）。
 */
type Envelope = {
  value: unknown;
  storedAtMs: number;
  ttlMs: number;
};

/**
 * Redis TTL 缓存；连接失败时自动降级到内存并在 ping 标 degraded。
 */
export class RedisCacheStore implements CacheStore {
  private readonly redis: Redis;
  private readonly fallback = new MemoryCacheStore();
  private degraded = false;

  /**
   * @param url - Redis 连接 URL
   */
  constructor(url: string) {
    this.redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.redis.on('error', () => {
      this.degraded = true;
    });
  }

  /**
   * 建立连接；失败则标记降级但不抛错。
   *
   * @returns 无返回值
   */
  async connect(): Promise<void> {
    try {
      await this.redis.connect();
      await this.redis.ping();
      this.degraded = false;
    } catch {
      this.degraded = true;
    }
  }

  /**
   * @param key - 缓存键
   * @param value - 值
   * @param ttlMs - TTL
   * @returns 无返回值
   */
  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    const envelope: Envelope = {
      value,
      storedAtMs: Date.now(),
      ttlMs,
    };
    await this.fallback.set(key, value, ttlMs);
    if (this.degraded) {
      return;
    }
    try {
      // 额外保留 24h 供 stale 读取
      const keepMs = Math.max(ttlMs, 86_400_000);
      await this.redis.set(key, JSON.stringify(envelope), 'PX', keepMs);
      this.degraded = false;
    } catch {
      this.degraded = true;
    }
  }

  /**
   * @param key - 缓存键
   * @returns 新鲜条目
   */
  async getFresh<T>(key: string): Promise<CacheLookup<T> | undefined> {
    const lookup = await this.read<T>(key);
    if (!lookup || lookup.stale) {
      return undefined;
    }
    return lookup;
  }

  /**
   * @param key - 缓存键
   * @returns 含 stale
   */
  async getIncludingStale<T>(key: string): Promise<CacheLookup<T> | undefined> {
    return this.read<T>(key);
  }

  /**
   * @param key - 缓存键
   * @returns 是否存在
   */
  async has(key: string): Promise<boolean> {
    const hit = await this.read(key);
    return Boolean(hit);
  }

  /**
   * @returns 健康状态
   */
  async ping(): Promise<'ok' | 'degraded' | 'unknown'> {
    if (this.degraded) {
      return 'degraded';
    }
    try {
      await this.redis.ping();
      return 'ok';
    } catch {
      this.degraded = true;
      return 'degraded';
    }
  }

  /**
   * @returns 无返回值
   */
  async close(): Promise<void> {
    await this.fallback.close();
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }

  /**
   * 从 Redis 或内存降级读取。
   *
   * @param key - 键
   * @returns 查找结果
   */
  private async read<T>(key: string): Promise<CacheLookup<T> | undefined> {
    if (!this.degraded) {
      try {
        const raw = await this.redis.get(key);
        if (raw) {
          const envelope = JSON.parse(raw) as Envelope;
          const ageMs = Date.now() - envelope.storedAtMs;
          return {
            value: envelope.value as T,
            ageMs,
            stale: ageMs > envelope.ttlMs,
          };
        }
      } catch {
        this.degraded = true;
      }
    }
    return this.fallback.getIncludingStale<T>(key);
  }
}

/**
 * 创建并连接 Redis 缓存；失败时返回内存实现。
 *
 * @param url - Redis URL；空则直接内存
 * @returns CacheStore
 */
export async function createCacheStore(url?: string): Promise<CacheStore> {
  if (!url?.trim()) {
    return new MemoryCacheStore();
  }
  const store = new RedisCacheStore(url.trim());
  await store.connect();
  return store;
}
