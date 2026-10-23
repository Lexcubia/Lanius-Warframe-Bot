import type { Logger } from '@lanius/logger';

import { fetchMissionDeckCatalog } from '../adapters/public-export/mission-deck-catalog.js';
import type {
  MissionDeckCatalog,
  MissionDeckRewardTable,
} from '../adapters/worldstate/resolve-mission-deck.js';
import { buildMissionDeckCatalog } from '../adapters/worldstate/resolve-mission-deck.js';
import type { CacheStore } from '../cache/types.js';

/** MissionDeck 目录缓存 TTL（24h；随版本表变更，与图标目录同量级）。 */
export const MISSION_DECK_CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

/** 缓存键。 */
const CATALOG_CACHE_KEY = 'public-export:mission-deck-catalog:v1';

/**
 * 可序列化的目录载荷（Redis/内存缓存用）。
 */
type CachedCatalogPayload = {
  entries: Array<[string, MissionDeckRewardTable]>;
};

/**
 * MissionDeck 服务依赖。
 */
export type MissionDeckServiceDeps = {
  cache: CacheStore;
  logger: Logger;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

/**
 * 加载 ExportRewards 并缓存为 MissionDeck 目录（赏金 Jobs 奖励展开）。
 */
export class MissionDeckService {
  private readonly cache: CacheStore;
  private readonly logger: Logger;
  private readonly fetchImpl?: typeof fetch;
  private readonly baseUrl?: string;
  /** 进程内热缓存。 */
  private memoryCatalog: MissionDeckCatalog | undefined;
  private memoryLoadedAtMs = 0;
  private loadPromise: Promise<MissionDeckCatalog> | undefined;

  /**
   * @param deps - 缓存、日志与可选 fetch
   */
  constructor(deps: MissionDeckServiceDeps) {
    this.cache = deps.cache;
    this.logger = deps.logger;
    this.fetchImpl = deps.fetchImpl;
    this.baseUrl = deps.baseUrl;
  }

  /**
   * 取得 MissionDeck 目录（内存 → Redis → 上游）。
   * 上游失败且无缓存时返回空目录，不抛错（赏金仍可显示 Job 元数据）。
   *
   * @returns 路径 → 奖励表映射
   */
  async getCatalog(): Promise<MissionDeckCatalog> {
    const now = Date.now();
    if (this.memoryCatalog && now - this.memoryLoadedAtMs < MISSION_DECK_CATALOG_TTL_MS) {
      return this.memoryCatalog;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadCatalog().finally(() => {
      this.loadPromise = undefined;
    });
    return this.loadPromise;
  }

  /**
   * 从缓存或上游加载目录。
   *
   * @returns 目录 Map
   */
  private async loadCatalog(): Promise<MissionDeckCatalog> {
    const fresh = await this.cache.getFresh<CachedCatalogPayload>(CATALOG_CACHE_KEY);
    if (fresh) {
      const map = buildMissionDeckCatalog(Object.fromEntries(fresh.value.entries));
      this.memoryCatalog = map;
      this.memoryLoadedAtMs = Date.now();
      return map;
    }

    try {
      const catalog = await fetchMissionDeckCatalog({
        baseUrl: this.baseUrl,
        fetchImpl: this.fetchImpl,
      });
      const payload: CachedCatalogPayload = {
        entries: [...catalog.entries()],
      };
      await this.cache.set(CATALOG_CACHE_KEY, payload, MISSION_DECK_CATALOG_TTL_MS);
      this.memoryCatalog = catalog;
      this.memoryLoadedAtMs = Date.now();
      this.logger.info({ size: catalog.size }, 'mission deck catalog loaded from ExportRewards');
      return catalog;
    } catch (error) {
      const stale = await this.cache.getIncludingStale<CachedCatalogPayload>(CATALOG_CACHE_KEY);
      if (stale) {
        this.logger.warn(
          {
            err: serializeError(error),
            cacheAgeMs: stale.ageMs,
          },
          'mission deck catalog upstream failed; using stale cache',
        );
        const map = buildMissionDeckCatalog(Object.fromEntries(stale.value.entries));
        this.memoryCatalog = map;
        this.memoryLoadedAtMs = Date.now();
        return map;
      }

      this.logger.error(
        { err: serializeError(error) },
        'mission deck catalog unavailable; bounty rewards will be empty',
      );
      const empty: MissionDeckCatalog = new Map();
      this.memoryCatalog = empty;
      this.memoryLoadedAtMs = Date.now();
      return empty;
    }
  }
}

/**
 * 将未知错误转为可日志对象。
 *
 * @param error - catch 值
 * @returns 安全日志字段
 */
function serializeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: 'UnknownError', message: String(error) };
}
