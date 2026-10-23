import type { CatalogItemDto, RotationWeaponDto, TraderItemDto, WorldstateDto } from '@lanius/core';
import type { Logger } from '@lanius/logger';

import {
  fetchItemIconCatalog,
  lookupItemIcon,
  type ItemIconCatalog,
} from '../adapters/public-export/item-icon-catalog.js';
import type { CacheStore } from '../cache/types.js';

/** 物品图标目录缓存 TTL（24h；图标路径变更极少）。 */
export const ITEM_ICON_CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

/** 缓存键。 */
const CATALOG_CACHE_KEY = 'public-export:item-icon-catalog:v1';

/**
 * 可序列化的目录条目（Redis/内存缓存用）。
 */
type CachedCatalogPayload = {
  entries: Array<[string, { iconPath: string; iconUrl: string }]>;
};

/**
 * 物品图标服务依赖。
 */
export type ItemIconServiceDeps = {
  cache: CacheStore;
  logger: Logger;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

/**
 * 加载 PublicExport 物品图标目录，并为 DTO 填充官方 iconUrl。
 */
export class ItemIconService {
  private readonly cache: CacheStore;
  private readonly logger: Logger;
  private readonly fetchImpl?: typeof fetch;
  private readonly baseUrl?: string;
  /** 进程内热缓存，避免每次反序列化 Map。 */
  private memoryCatalog: ItemIconCatalog | undefined;
  private memoryLoadedAtMs = 0;
  private loadPromise: Promise<ItemIconCatalog> | undefined;

  /**
   * @param deps - 缓存、日志与可选 fetch
   */
  constructor(deps: ItemIconServiceDeps) {
    this.cache = deps.cache;
    this.logger = deps.logger;
    this.fetchImpl = deps.fetchImpl;
    this.baseUrl = deps.baseUrl;
  }

  /**
   * 为商人货架条目补齐官方图标。
   *
   * @param items - 映射后的货架（已含 uniqueName）
   * @returns 带 iconPath/iconUrl 的新数组
   */
  async enrichTraderItems(items: TraderItemDto[]): Promise<TraderItemDto[]> {
    const catalog = await this.getCatalog();
    return items.map((item) => this.enrichOne(item, catalog));
  }

  /**
   * 为信条 / 终幕轮换武器补齐官方图标。
   *
   * @param items - 已含 uniqueName 的轮换武器
   * @returns 带 iconPath/iconUrl 的新数组
   */
  async enrichRotationWeapons(items: RotationWeaponDto[]): Promise<RotationWeaponDto[]> {
    const catalog = await this.getCatalog();
    return items.map((item) => this.enrichOne(item, catalog));
  }

  /**
   * 为世界状态中的入侵 / 警报奖励补齐官方图标。
   *
   * @param worldstate - 已映射的世界状态 DTO
   * @returns 奖励字段带图标的新 DTO（其余字段浅拷贝）
   */
  async enrichWorldstate(worldstate: WorldstateDto): Promise<WorldstateDto> {
    const catalog = await this.getCatalog();
    return {
      ...worldstate,
      invasions: worldstate.invasions.map((row) => ({
        ...row,
        attackerReward: row.attackerReward
          ? this.enrichOne(row.attackerReward, catalog)
          : undefined,
        defenderReward: row.defenderReward
          ? this.enrichOne(row.defenderReward, catalog)
          : undefined,
      })),
      alerts: worldstate.alerts.map((row) => ({
        ...row,
        rewards: row.rewards.map((reward) => this.enrichOne(reward, catalog)),
      })),
    };
  }

  /**
   * 取得图标目录（内存 → Redis → 上游）。
   *
   * @returns uniqueName → 图标映射
   */
  async getCatalog(): Promise<ItemIconCatalog> {
    const now = Date.now();
    if (this.memoryCatalog && now - this.memoryLoadedAtMs < ITEM_ICON_CATALOG_TTL_MS) {
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
  private async loadCatalog(): Promise<ItemIconCatalog> {
    const fresh = await this.cache.getFresh<CachedCatalogPayload>(CATALOG_CACHE_KEY);
    if (fresh) {
      const map = new Map(fresh.value.entries);
      this.memoryCatalog = map;
      this.memoryLoadedAtMs = Date.now();
      return map;
    }

    try {
      const catalog = await fetchItemIconCatalog({
        baseUrl: this.baseUrl,
        fetchImpl: this.fetchImpl,
      });
      const payload: CachedCatalogPayload = {
        entries: [...catalog.entries()],
      };
      await this.cache.set(CATALOG_CACHE_KEY, payload, ITEM_ICON_CATALOG_TTL_MS);
      this.memoryCatalog = catalog;
      this.memoryLoadedAtMs = Date.now();
      this.logger.info({ size: catalog.size }, 'item icon catalog loaded from public-export-plus');
      return catalog;
    } catch (error) {
      const stale = await this.cache.getIncludingStale<CachedCatalogPayload>(CATALOG_CACHE_KEY);
      if (stale) {
        this.logger.warn(
          {
            err:
              error instanceof Error
                ? { name: error.name, message: error.message }
                : { name: 'UnknownError', message: String(error) },
            cacheAgeMs: stale.ageMs,
          },
          'item icon catalog upstream failed; using stale cache',
        );
        const map = new Map(stale.value.entries);
        this.memoryCatalog = map;
        this.memoryLoadedAtMs = Date.now();
        return map;
      }

      this.logger.error(
        {
          err:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { name: 'UnknownError', message: String(error) },
        },
        'item icon catalog unavailable; icons will be omitted',
      );
      const empty: ItemIconCatalog = new Map();
      this.memoryCatalog = empty;
      this.memoryLoadedAtMs = Date.now();
      return empty;
    }
  }

  /**
   * 为单条 CatalogItem 写入图标字段（不修改入参）。
   *
   * @param item - 物品引用
   * @param catalog - 目录
   * @returns 可能带 icon 的新对象
   */
  private enrichOne<T extends CatalogItemDto>(item: T, catalog: ItemIconCatalog): T {
    if (!item.uniqueName) {
      return item;
    }
    const hit = lookupItemIcon(catalog, item.uniqueName);
    if (!hit) {
      return item;
    }
    return {
      ...item,
      iconPath: hit.iconPath,
      iconUrl: hit.iconUrl,
    };
  }
}
