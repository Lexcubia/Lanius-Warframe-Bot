/**
 * 缓存查找结果（含年龄与是否过期）。
 */
export type CacheLookup<T> = {
  value: T;
  ageMs: number;
  stale: boolean;
};

/**
 * 可插拔业务 TTL 缓存（Redis 优先，内存降级）。
 */
export type CacheStore = {
  /**
   * 写入带 TTL 的值。
   *
   * @param key - 缓存键
   * @param value - 可 JSON 序列化的值
   * @param ttlMs - 存活毫秒
   * @returns 无返回值
   */
  set(key: string, value: unknown, ttlMs: number): Promise<void>;

  /**
   * 读取未过期条目。
   *
   * @param key - 缓存键
   * @returns 新鲜条目或 undefined
   */
  getFresh<T>(key: string): Promise<CacheLookup<T> | undefined>;

  /**
   * 读取条目（含已过期的 stale）。
   *
   * @param key - 缓存键
   * @returns 条目或 undefined
   */
  getIncludingStale<T>(key: string): Promise<CacheLookup<T> | undefined>;

  /**
   * 是否存在任意（含 stale）条目。
   *
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: string): Promise<boolean>;

  /**
   * 探测后端是否可用。
   *
   * @returns `ok` | `degraded` | `unknown`
   */
  ping(): Promise<'ok' | 'degraded' | 'unknown'>;

  /**
   * 关闭底层连接（进程退出）。
   *
   * @returns 无返回值
   */
  close(): Promise<void>;
};
