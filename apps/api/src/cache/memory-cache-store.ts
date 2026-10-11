import type { CacheLookup, CacheStore } from './types.js';

/**
 * 内存 TTL 条目。
 */
type Entry = {
  value: unknown;
  storedAtMs: number;
  ttlMs: number;
};

/**
 * 进程内 TTL 缓存（Redis 不可用时的降级实现）。
 */
export class MemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, Entry>();

  /**
   * @param key - 缓存键
   * @param value - 值
   * @param ttlMs - TTL 毫秒
   * @returns 无返回值
   */
  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    this.store.set(key, { value, storedAtMs: Date.now(), ttlMs });
  }

  /**
   * @param key - 缓存键
   * @returns 新鲜条目
   */
  async getFresh<T>(key: string): Promise<CacheLookup<T> | undefined> {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    const ageMs = Date.now() - entry.storedAtMs;
    if (ageMs > entry.ttlMs) {
      return undefined;
    }
    return { value: entry.value as T, ageMs, stale: false };
  }

  /**
   * @param key - 缓存键
   * @returns 含 stale 的条目
   */
  async getIncludingStale<T>(key: string): Promise<CacheLookup<T> | undefined> {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    const ageMs = Date.now() - entry.storedAtMs;
    return {
      value: entry.value as T,
      ageMs,
      stale: ageMs > entry.ttlMs,
    };
  }

  /**
   * @param key - 缓存键
   * @returns 是否存在
   */
  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  /**
   * @returns 始终 ok
   */
  async ping(): Promise<'ok' | 'degraded' | 'unknown'> {
    return 'ok';
  }

  /**
   * @returns 无返回值
   */
  async close(): Promise<void> {
    this.store.clear();
  }
}
