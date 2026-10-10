/**
 * Single entry stored in the process-local TTL cache.
 */
export type TtlCacheEntry<T> = {
  value: T;
  storedAtMs: number;
  ttlMs: number;
};

/**
 * Result of a cache lookup, including age and freshness.
 */
export type TtlCacheLookup<T> = {
  value: T;
  ageMs: number;
  stale: boolean;
};

/**
 * Minimal in-memory TTL map for MVP caching (no Redis).
 * Stale reads are supported so upstream failures can serve the last good value.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, TtlCacheEntry<T>>();

  /**
   * Writes a value under the given key with a TTL.
   *
   * @param key - Cache key (e.g. `worldstate:international`).
   * @param value - Value to store until expiry.
   * @param ttlMs - Time-to-live in milliseconds.
   * @returns No return value.
   */
  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      storedAtMs: Date.now(),
      ttlMs,
    });
  }

  /**
   * Reads a fresh (non-expired) entry, or `undefined` if missing/expired.
   *
   * @param key - Cache key to look up.
   * @returns Lookup result when fresh; otherwise `undefined`.
   */
  getFresh(key: string): TtlCacheLookup<T> | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    const ageMs = Date.now() - entry.storedAtMs;
    if (ageMs > entry.ttlMs) {
      return undefined;
    }
    return { value: entry.value, ageMs, stale: false };
  }

  /**
   * Reads an entry even if expired, marking `stale` when past TTL.
   * Used for upstream-failure fallback.
   *
   * @param key - Cache key to look up.
   * @returns Lookup result including staleness, or `undefined` if never stored.
   */
  getIncludingStale(key: string): TtlCacheLookup<T> | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    const ageMs = Date.now() - entry.storedAtMs;
    return {
      value: entry.value,
      ageMs,
      stale: ageMs > entry.ttlMs,
    };
  }

  /**
   * Reports whether any entry exists for the key (fresh or stale).
   *
   * @param key - Cache key to probe.
   * @returns `true` when the key has been written at least once.
   */
  has(key: string): boolean {
    return this.store.has(key);
  }
}
