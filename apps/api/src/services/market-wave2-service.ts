import {
  DUCAT_TIER_VALUES,
  MARKET_ORDERS_PAGE_SIZE,
  resolveBestItem,
  resolveWfmAssetUrl,
  type DucatJunkDto,
  type DucatTier,
  type ItemIndexRow,
  type MarketRankCategory,
  type MarketRankDto,
  type MarketTrendDto,
} from '@lanius/core';

import {
  WarframeMarketClient,
  type WfmItemStatistics,
  type WfmItemRow,
} from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { notFoundError, validationError } from '../lib/http-error.js';

const DUCATS_TTL_MS = 15 * 60_000;
const TREND_TTL_MS = 5 * 60_000;
const RANK_TTL_MS = 60 * 60_000;
const RANK_SAMPLE = 36;

/**
 * 分类 → WFM tags 任一命中即可。
 */
const RANK_TAG_FILTER: Readonly<Record<MarketRankCategory, readonly string[] | null>> = {
  all: null,
  warframe: ['warframe'],
  primary: ['primary', 'rifle', 'shotgun', 'bow'],
  secondary: ['secondary', 'pistol'],
  melee: ['melee'],
  mod: ['mod'],
  arcane: ['arcane_enhancement', 'arcane'],
  part: ['component', 'set'],
  relic: ['relic'],
};

/**
 * Wave 2 市场扩展：趋势 / 排行 / 杜卡德垃圾。
 */
export class MarketWave2Service {
  private readonly cache: CacheStore;
  private readonly client: WarframeMarketClient;

  /**
   * @param deps - 缓存与 WFM 客户端
   */
  constructor(deps: { cache: CacheStore; client?: WarframeMarketClient }) {
    this.cache = deps.cache;
    this.client = deps.client ?? new WarframeMarketClient();
  }

  /**
   * 物品价格趋势（48h / 90d closed 统计）。
   *
   * @param query - 物品关键词
   * @returns 趋势 DTO
   */
  async getTrend(query: string): Promise<MarketTrendDto> {
    const q = query.trim();
    if (!q) {
      throw validationError('query is required');
    }
    const { hit, zhName, enName, iconUrl } = await this.resolveItem(q);
    const cacheKey = `wfm:trend:v1:${hit.urlName}`;
    const cached = await this.cache.getFresh<WfmItemStatistics>(cacheKey);
    const stats =
      cached?.value ??
      (await (async () => {
        const fresh = await this.client.getItemStatistics(hit.urlName);
        await this.cache.set(cacheKey, fresh, TREND_TTL_MS);
        return fresh;
      })());
    const summary = summarizeStats(stats);
    return {
      query: q,
      resolved: {
        urlName: hit.urlName,
        name: { zh: zhName, en: enName },
        ...(iconUrl ? { iconUrl } : {}),
      },
      h48: stats.h48.map(mapPoint),
      d90: stats.d90.map(mapPoint),
      summary,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 杜卡德垃圾榜（金/银/铜）。
   *
   * @param tier - 档位
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 榜单 DTO
   */
  async getDucatJunk(
    tier: DucatTier,
    page: number,
    pageSize: number,
  ): Promise<DucatJunkDto> {
    const size = Math.min(Math.max(1, pageSize || MARKET_ORDERS_PAGE_SIZE), MARKET_ORDERS_PAGE_SIZE);
    const pg = Math.max(1, page || 1);
    const want = new Set(DUCAT_TIER_VALUES[tier]);
    const board = await this.loadDucatBoard();
    const pool = board.filter((r) => want.has(r.ducats));
    const total = pool.length;
    const start = (pg - 1) * size;
    return {
      tier,
      page: pg,
      pageSize: size,
      total,
      rows: pool.slice(start, start + size),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 市场成交中位价排行（抽样缓存，非 SDJK 全站爬取）。
   *
   * @param category - 分类
   * @param page - 页码
   * @param pageSize - 每页
   * @returns 排行 DTO
   */
  async getRank(
    category: MarketRankCategory,
    page: number,
    pageSize: number,
  ): Promise<MarketRankDto> {
    const size = Math.min(Math.max(1, pageSize || MARKET_ORDERS_PAGE_SIZE), MARKET_ORDERS_PAGE_SIZE);
    const pg = Math.max(1, page || 1);
    const cacheKey = `wfm:rank:sample:v1:${category}`;
    const cached = await this.cache.getFresh<MarketRankDto['rows']>(cacheKey);
    let rows = cached?.value;
    if (!rows) {
      rows = await this.buildRankSample(category);
      await this.cache.set(cacheKey, rows, RANK_TTL_MS);
    }
    const total = rows.length;
    const start = (pg - 1) * size;
    return {
      category,
      page: pg,
      pageSize: size,
      total,
      rows: rows.slice(start, start + size),
      sampled: true,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 加载并合并杜卡德榜与物品索引。
   *
   * @returns 按 dpp 降序的垃圾行
   */
  private async loadDucatBoard(): Promise<DucatJunkDto['rows']> {
    const cacheKey = 'wfm:ducats:board:v1';
    const cached = await this.cache.getFresh<DucatJunkDto['rows']>(cacheKey);
    if (cached?.value) {
      return cached.value;
    }
    const [toolRows, zhItems, enItems] = await Promise.all([
      this.client.getDucatsBoard(),
      this.client.listItems('zh-hans'),
      this.client.listItems('en'),
    ]);
    const byId = new Map<string, { zh?: WfmItemRow; en?: WfmItemRow }>();
    for (const row of zhItems) {
      if (row.id) {
        byId.set(row.id, { ...(byId.get(row.id) ?? {}), zh: row });
      }
    }
    for (const row of enItems) {
      if (row.id) {
        byId.set(row.id, { ...(byId.get(row.id) ?? {}), en: row });
      }
    }
    const out: DucatJunkDto['rows'] = [];
    for (const row of toolRows) {
      const pair = byId.get(row.itemId);
      const zh = pair?.zh;
      const en = pair?.en;
      const urlName = zh?.url_name || en?.url_name;
      if (!urlName) {
        continue;
      }
      out.push({
        urlName,
        name: {
          zh: zh?.item_name ?? en?.item_name ?? urlName,
          en: en?.item_name ?? zh?.item_name ?? urlName,
        },
        ducats: row.ducats,
        ducatsPerPlatinum: row.ducatsPerPlatinum,
        waPrice: row.waPrice,
        median: row.median,
        volume: row.volume,
      });
    }
    out.sort((a, b) => b.ducatsPerPlatinum - a.ducatsPerPlatinum);
    await this.cache.set(cacheKey, out, DUCATS_TTL_MS);
    return out;
  }

  /**
   * 按分类抽样拉取统计并生成排行行。
   *
   * @param category - 分类
   * @returns 按 median48 降序行
   */
  private async buildRankSample(category: MarketRankCategory): Promise<MarketRankDto['rows']> {
    const [zhItems, enItems] = await Promise.all([
      this.client.listItems('zh-hans'),
      this.client.listItems('en'),
    ]);
    const enBySlug = new Map(enItems.map((r) => [r.url_name, r]));
    const tagFilter = RANK_TAG_FILTER[category];
    const candidates = zhItems.filter((row) => {
      if (!tagFilter) {
        return true;
      }
      const tags = row.tags ?? [];
      return tagFilter.some((t) => tags.includes(t));
    });
    // 均匀抽样，避免只打字母序前缀。
    const step = Math.max(1, Math.floor(candidates.length / RANK_SAMPLE));
    const sample = candidates.filter((_, i) => i % step === 0).slice(0, RANK_SAMPLE);
    const rows: MarketRankDto['rows'] = [];
    // 限并发拉统计，避免打爆 WFM。
    const concurrency = 6;
    for (let i = 0; i < sample.length; i += concurrency) {
      const chunk = sample.slice(i, i + concurrency);
      const settled = await Promise.allSettled(
        chunk.map(async (item) => {
          const stats = await this.client.getItemStatistics(item.url_name);
          const medians = stats.h48.map((p) => p.median).filter((n): n is number => n != null);
          if (medians.length === 0) {
            return null;
          }
          const median48 = medians.reduce((a, b) => a + b, 0) / medians.length;
          const mins = stats.h48.map((p) => p.min).filter((n): n is number => n != null);
          const maxs = stats.h48.map((p) => p.max).filter((n): n is number => n != null);
          const vol48 = stats.h48.reduce((a, p) => a + p.volume, 0);
          const vol90 = stats.d90.reduce((a, p) => a + p.volume, 0);
          if (vol48 < 3) {
            return null;
          }
          const en = enBySlug.get(item.url_name);
          return {
            urlName: item.url_name,
            name: {
              zh: item.item_name,
              en: en?.item_name ?? item.item_name,
            },
            median48: Math.round(median48 * 10) / 10,
            min48: mins.length ? Math.min(...mins) : null,
            max48: maxs.length ? Math.max(...maxs) : null,
            vol48,
            vol90,
          };
        }),
      );
      for (const result of settled) {
        if (result.status === 'fulfilled' && result.value) {
          rows.push(result.value);
        }
      }
    }
    rows.sort((a, b) => b.median48 - a.median48);
    return rows;
  }

  /**
   * 模糊锁定物品并取中英名 / 图标。
   *
   * @param query - 关键词
   * @returns 命中与展示字段
   */
  private async resolveItem(query: string): Promise<{
    hit: ItemIndexRow;
    zhName: string;
    enName: string;
    iconUrl?: string;
  }> {
    const [zhIndex, enIndex] = await Promise.all([
      this.getItemIndex('zh-hans'),
      this.getItemIndex('en'),
    ]);
    const hit = resolveBestItem(query, mergeIndex(zhIndex, enIndex));
    if (!hit) {
      throw notFoundError(`未匹配到物品：${query}`);
    }
    const zh = zhIndex.find((r) => r.urlName === hit.urlName);
    const en = enIndex.find((r) => r.urlName === hit.urlName);
    const iconUrl = resolveWfmAssetUrl(zh?.thumb || en?.thumb);
    return {
      hit,
      zhName: zh?.itemName ?? hit.itemName,
      enName: en?.itemName ?? hit.urlName.replace(/_/g, ' '),
      ...(iconUrl ? { iconUrl } : {}),
    };
  }

  /**
   * 带缓存的物品索引。
   *
   * @param language - 语言
   * @returns 索引行
   */
  private async getItemIndex(language: 'zh-hans' | 'en'): Promise<Array<ItemIndexRow & { thumb?: string }>> {
    const key = `wfm:items:index:v2:${language}`;
    const cached = await this.cache.getFresh<Array<ItemIndexRow & { thumb?: string }>>(key);
    if (cached?.value) {
      return cached.value;
    }
    const rows = await this.client.listItems(language);
    const mapped = rows.map((r) => ({
      urlName: r.url_name,
      itemName: r.item_name,
      ...(r.thumb ? { thumb: r.thumb } : {}),
    }));
    await this.cache.set(key, mapped, 6 * 60 * 60_000);
    return mapped;
  }
}

/**
 * 合并中英索引（同 slug 优先中文名）。
 *
 * @param zh - 中文
 * @param en - 英文
 * @returns 合并行
 */
function mergeIndex(
  zh: ItemIndexRow[],
  en: ItemIndexRow[],
): ItemIndexRow[] {
  const map = new Map<string, ItemIndexRow>();
  for (const row of en) {
    map.set(row.urlName, row);
  }
  for (const row of zh) {
    map.set(row.urlName, row);
  }
  return [...map.values()];
}

/**
 * 统计点 → DTO 点。
 *
 * @param p - 客户端点
 * @returns DTO 点
 */
function mapPoint(p: WfmItemStatistics['h48'][number]) {
  return {
    t: p.t,
    volume: p.volume,
    median: p.median,
    avg: p.avg,
    min: p.min,
    max: p.max,
    modRank: p.modRank,
  };
}

/**
 * 汇总趋势摘要（对齐 SDJK summarize_stats）。
 *
 * @param stats - 统计
 * @returns 摘要
 */
function summarizeStats(stats: WfmItemStatistics): MarketTrendDto['summary'] {
  const vol48 = stats.h48.reduce((a, p) => a + p.volume, 0);
  const vol90 = stats.d90.reduce((a, p) => a + p.volume, 0);
  const med48 = avg(stats.h48.map((p) => p.median));
  const med90 = avg(stats.d90.map((p) => p.median));
  const last = lastFinite(stats.h48.map((p) => p.median));
  const baseSource = stats.d90.length >= 3 ? stats.d90 : stats.h48;
  const baseSpan = stats.d90.length >= 3 ? ('90d' as const) : ('48h' as const);
  const third = Math.max(1, Math.floor(baseSource.length / 3));
  const base = avg(baseSource.slice(0, third).map((p) => p.median));
  let changePct: number | null = null;
  if (last != null && base != null && base !== 0) {
    const roundedBase = Math.round(base * 10) / 10;
    changePct = ((last - roundedBase) / roundedBase) * 100;
  }
  return {
    vol48,
    vol90,
    median48: med48,
    median90: med90,
    last,
    base,
    baseSpan,
    changePct: changePct == null ? null : Math.round(changePct * 10) / 10,
  };
}

/**
 * 非空数字均值。
 *
 * @param values - 可空数字列
 * @returns 均值或 null
 */
function avg(values: Array<number | null>): number | null {
  const nums = values.filter((n): n is number => n != null && Number.isFinite(n));
  if (nums.length === 0) {
    return null;
  }
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

/**
 * 取最后一个有限数字。
 *
 * @param values - 列
 * @returns 末值或 null
 */
function lastFinite(values: Array<number | null>): number | null {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const v = values[i];
    if (v != null && Number.isFinite(v)) {
      return v;
    }
  }
  return null;
}
