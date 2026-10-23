import {
  MARKET_ORDERS_PAGE_SIZE,
  resolveBestItem,
  resolveWfmAssetUrl,
  type ItemIndexRow,
  type MarketListingDto,
  type MarketOrdersDto,
  type MarketSellerStatus,
} from '@lanius/core';

import { WarframeMarketClient } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { notFoundError, validationError } from '../lib/http-error.js';

const ITEMS_INDEX_TTL_MS = 6 * 60 * 60_000;
const ITEM_ORDERS_TTL_MS = 90_000;

/**
 * 带可选 thumb 的索引行（缓存用）。
 */
type ItemIndexRowWithThumb = ItemIndexRow & {
  /** WFM 相对或绝对 thumb */
  thumb?: string;
};

/**
 * 市场卖单查询入参（路由已校验后的业务形）。
 */
export type MarketOrdersSearchInput = {
  /** 物品关键词（中英 / slug） */
  query: string;
  /** 页码，从 1 起 */
  page: number;
  /** 每页条数，封顶 10 */
  pageSize: number;
  /** 可选模组等级过滤 */
  modRank?: number;
};

/**
 * Warframe Market 物品卖单排行服务。
 */
export class MarketService {
  private readonly cache: CacheStore;
  private readonly client: WarframeMarketClient;

  /**
   * @param deps - 缓存与上游客户端
   */
  constructor(deps: { cache: CacheStore; client?: WarframeMarketClient }) {
    this.cache = deps.cache;
    this.client = deps.client ?? new WarframeMarketClient();
  }

  /**
   * 中文模糊锁定单一物品后，返回在线/游戏中卖单（价升序分页）。
   * 仅用 WFM zh-hans / 英文索引，不含社区自造别名。
   *
   * @param input - 查询与分页/等级过滤
   * @returns 卖单分页 DTO
   * @throws HttpError 空查询或未命中物品
   */
  async searchOrders(input: MarketOrdersSearchInput): Promise<MarketOrdersDto> {
    const q = input.query.trim();
    if (!q) {
      throw validationError('query is required');
    }

    const pageSize = Math.min(
      Math.max(1, input.pageSize || MARKET_ORDERS_PAGE_SIZE),
      MARKET_ORDERS_PAGE_SIZE,
    );
    const page = Math.max(1, input.page || 1);

    const zhIndex = await this.getItemIndex('zh-hans');
    const enIndex = await this.getItemIndex('en');
    const hit = resolveBestItem(q, mergeIndexRows(zhIndex, enIndex));
    if (!hit) {
      throw notFoundError(`未匹配到物品：${q} / No market item matched: ${q}`);
    }

    const enName =
      enIndex.find((row) => row.urlName === hit.urlName)?.itemName ??
      hit.urlName.replace(/_/g, ' ');
    const zhRow = zhIndex.find((row) => row.urlName === hit.urlName);
    const enRow = enIndex.find((row) => row.urlName === hit.urlName);
    const zhName = zhRow?.itemName ?? hit.itemName;
    const iconUrl = resolveWfmAssetUrl(zhRow?.thumb || enRow?.thumb);

    const listings = await this.loadSellListings(hit.urlName);
    const filtered =
      input.modRank === undefined
        ? listings
        : listings.filter((row) => row.modRank === input.modRank);

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const orders = filtered.slice(start, start + pageSize);
    const updatedAt = new Date().toISOString();

    return {
      query: q,
      resolved: {
        urlName: hit.urlName,
        name: { zh: zhName, en: enName },
        ...(iconUrl ? { iconUrl } : {}),
      },
      page,
      pageSize,
      total,
      orders,
      statusFilter: 'online|ingame',
      sort: 'price_asc',
      modRank: input.modRank ?? null,
      updatedAt,
    };
  }

  /**
   * 读取（或刷新）指定语言的物品索引。
   *
   * @param language - WFM Language（缓存键区分）
   * @returns 索引行（含 thumb）
   */
  private async getItemIndex(language: 'zh-hans' | 'en'): Promise<ItemIndexRowWithThumb[]> {
    // v2 前缀：避免旧 v1 空索引缓存污染；thumb 字段变更时 bump 键。
    const key = `wfm:v2:items:index:thumb:${language}`;
    const fresh = await this.cache.getFresh<ItemIndexRowWithThumb[]>(key);
    if (fresh) {
      return fresh.value;
    }
    const items = await this.client.listItems(language);
    const slim: ItemIndexRowWithThumb[] = items.map((item) => ({
      urlName: item.url_name,
      itemName: item.item_name,
      ...(item.thumb ? { thumb: item.thumb } : {}),
    }));
    await this.cache.set(key, slim, ITEMS_INDEX_TTL_MS);
    return slim;
  }

  /**
   * 拉取并缓存某物品的在线/游戏中卖单（价升序）。
   *
   * @param urlName - WFM slug
   * @returns 规范化卖单列表
   */
  private async loadSellListings(urlName: string): Promise<MarketListingDto[]> {
    const key = `wfm:v2:item:sells:${urlName}`;
    const cached = await this.cache.getFresh<MarketListingDto[]>(key);
    if (cached) {
      return cached.value;
    }

    const orders = await this.client.listOrders(urlName);
    const listings: MarketListingDto[] = [];
    for (const order of orders) {
      if (order.order_type !== 'sell') {
        continue;
      }
      const status = normalizeSellerStatus(order.user?.status);
      if (!status) {
        continue;
      }
      const seller = order.user?.ingame_name?.trim() || 'unknown';
      listings.push({
        platinum: order.platinum,
        quantity: order.quantity,
        modRank: typeof order.mod_rank === 'number' && order.mod_rank >= 0 ? order.mod_rank : null,
        seller,
        status,
        updatedAt: order.last_update
          ? new Date(order.last_update).toISOString()
          : new Date().toISOString(),
      });
    }

    listings.sort((a, b) => a.platinum - b.platinum || a.seller.localeCompare(b.seller));
    await this.cache.set(key, listings, ITEM_ORDERS_TTL_MS);
    return listings;
  }
}

/**
 * 仅保留明确的 online / ingame；缺省或 offline 丢弃。
 *
 * @param raw - 上游 status 字符串
 * @returns 规范化状态或 null
 */
function normalizeSellerStatus(raw: string | undefined): MarketSellerStatus | null {
  if (raw === 'online' || raw === 'ingame') {
    return raw;
  }
  return null;
}

/**
 * 按 urlName 合并中英索引行（同 slug 保留先出现的中文名，英文侧仅补缺）。
 *
 * @param primary - 优先行（通常 zh-hans）
 * @param secondary - 补充行（通常 en）
 * @returns 去重后的索引
 */
function mergeIndexRows(
  primary: ItemIndexRowWithThumb[],
  secondary: ItemIndexRowWithThumb[],
): ItemIndexRowWithThumb[] {
  const map = new Map<string, ItemIndexRowWithThumb>();
  for (const row of primary) {
    map.set(row.urlName, row);
  }
  for (const row of secondary) {
    const existing = map.get(row.urlName);
    if (!existing) {
      map.set(row.urlName, row);
      continue;
    }
    // 补缺 thumb（中文侧偶发缺图时用英文 thumb）。
    if (!existing.thumb && row.thumb) {
      map.set(row.urlName, { ...existing, thumb: row.thumb });
    }
  }
  return [...map.values()];
}
