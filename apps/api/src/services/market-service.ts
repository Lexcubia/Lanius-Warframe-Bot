import {
  MARKET_ORDERS_PAGE_SIZE,
  resolveBestItem,
  resolveWfmAssetUrl,
  type ItemIndexRow,
  type MarketListingDto,
  type MarketOrdersDto,
  type MarketSellerStatus,
  type MarketSetComponent,
} from '@lanius/core';

import { WarframeMarketClient, type WfmItemDetail } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { notFoundError, validationError } from '../lib/http-error.js';

const ITEMS_INDEX_TTL_MS = 6 * 60 * 60_000;
const ITEM_DETAIL_TTL_MS = 6 * 60 * 60_000;
const ITEM_ORDERS_TTL_MS = 90_000;

/**
 * 带可选 thumb / id / ducats 的索引行（缓存用）。
 */
type ItemIndexRowWithMeta = ItemIndexRow & {
  /** WFM 物品 id */
  id?: string;
  /** WFM 相对或绝对 thumb */
  thumb?: string;
  /** 杜卡德价值 */
  ducats?: number | null;
  /** 上游 tags */
  tags?: string[];
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
   * 详情补充 ducats / 套装部件；卖单透出卖家声誉。
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

    const detail = await this.loadItemDetail(hit.urlName);
    const ducats = resolveDucats(detail, zhRow, enRow);
    const isSet = detectIsSet(detail, zhRow, enRow, hit.urlName);
    const components = isSet ? await this.buildSetComponents(detail, zhIndex, enIndex) : [];

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
        ducats,
        isSet,
        ...(components.length > 0 ? { components } : {}),
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
   * @returns 索引行（含 id / thumb / ducats）
   */
  private async getItemIndex(language: 'zh-hans' | 'en'): Promise<ItemIndexRowWithMeta[]> {
    // v2 meta：id/ducats 供套装部件解析；变更时 bump 键避免旧缓存缺字段。
    const key = `wfm:v2:items:index:meta:${language}`;
    const fresh = await this.cache.getFresh<ItemIndexRowWithMeta[]>(key);
    if (fresh) {
      return fresh.value;
    }
    const items = await this.client.listItems(language);
    const slim: ItemIndexRowWithMeta[] = items.map((item) => ({
      urlName: item.url_name,
      itemName: item.item_name,
      ...(item.id ? { id: item.id } : {}),
      ...(item.thumb ? { thumb: item.thumb } : {}),
      ducats: item.ducats ?? null,
      ...(item.tags && item.tags.length > 0 ? { tags: item.tags } : {}),
    }));
    await this.cache.set(key, slim, ITEMS_INDEX_TTL_MS);
    return slim;
  }

  /**
   * 拉取并缓存单物品详情（套装部件 id / ducats）。
   *
   * @param urlName - WFM slug
   * @returns 详情；上游失败时返回 null（不阻断卖单）
   */
  private async loadItemDetail(urlName: string): Promise<WfmItemDetail | null> {
    const key = `wfm:v2:item:detail:${urlName}`;
    const cached = await this.cache.getFresh<WfmItemDetail | null>(key);
    if (cached) {
      return cached.value;
    }
    try {
      const detail = await this.client.getItem(urlName, 'zh-hans');
      await this.cache.set(key, detail, ITEM_DETAIL_TTL_MS);
      return detail;
    } catch {
      // 详情失败不阻断卖单；套装部件/杜卡德可降级为空。
      await this.cache.set(key, null, 60_000);
      return null;
    }
  }

  /**
   * 由套装详情与中英索引组装部件列表（含图标与杜卡德条形数据）。
   *
   * @param detail - 套装详情（含 setParts）
   * @param zhIndex - 中文索引
   * @param enIndex - 英文索引
   * @returns 部件 DTO 列表（已排除套装自身）
   */
  private async buildSetComponents(
    detail: WfmItemDetail | null,
    zhIndex: ItemIndexRowWithMeta[],
    enIndex: ItemIndexRowWithMeta[],
  ): Promise<MarketSetComponent[]> {
    const partIds = detail?.setParts ?? [];
    if (partIds.length === 0) {
      return [];
    }
    const zhById = indexById(zhIndex);
    const enById = indexById(enIndex);
    const selfId = detail?.id;
    const out: MarketSetComponent[] = [];

    for (const partId of partIds) {
      if (selfId && partId === selfId) {
        continue;
      }
      const zhRow = zhById.get(partId);
      const enRow = enById.get(partId);
      const urlName = zhRow?.urlName ?? enRow?.urlName;
      if (!urlName) {
        continue;
      }
      // 部件详情补 quantityInSet；失败则仅用索引字段。
      const partDetail = await this.loadItemDetail(urlName);
      const zhName = zhRow?.itemName ?? enRow?.itemName ?? urlName.replace(/_/g, ' ');
      const enName = enRow?.itemName ?? zhRow?.itemName ?? urlName.replace(/_/g, ' ');
      const iconUrl = resolveWfmAssetUrl(zhRow?.thumb || enRow?.thumb || partDetail?.thumb);
      const ducats = resolveDucats(partDetail, zhRow, enRow);
      const quantityInSet = partDetail?.quantityInSet;
      out.push({
        urlName,
        name: { zh: zhName, en: enName },
        ...(iconUrl ? { iconUrl } : {}),
        ducats,
        ...(quantityInSet !== undefined ? { quantityInSet } : {}),
      });
    }
    return out;
  }

  /**
   * 拉取并缓存某物品的在线/游戏中卖单（价升序）。
   *
   * @param urlName - WFM slug
   * @returns 规范化卖单列表
   */
  private async loadSellListings(urlName: string): Promise<MarketListingDto[]> {
    // reputation 字段变更时 bump 缓存键。
    const key = `wfm:v2:item:sells:rep:${urlName}`;
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
        sellerReputation: normalizeReputation(order.user?.reputation),
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
 * 规范化 WFM 声誉为非负整数；缺失按 0。
 *
 * @param raw - 上游 reputation
 * @returns 非负整数
 */
function normalizeReputation(raw: number | undefined): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return Math.trunc(raw);
  }
  return 0;
}

/**
 * 从详情与索引行解析杜卡德；皆无则 null。
 *
 * @param detail - 物品详情
 * @param zhRow - 中文索引行
 * @param enRow - 英文索引行
 * @returns 杜卡德或 null
 */
function resolveDucats(
  detail: WfmItemDetail | null | undefined,
  zhRow: ItemIndexRowWithMeta | undefined,
  enRow: ItemIndexRowWithMeta | undefined,
): number | null {
  for (const candidate of [detail?.ducats, zhRow?.ducats, enRow?.ducats]) {
    if (typeof candidate === 'number' && candidate >= 0 && Number.isFinite(candidate)) {
      return Math.trunc(candidate);
    }
  }
  return null;
}

/**
 * 判断是否套装：详情 setRoot、tags 含 set、或 slug 以 `_set` 结尾。
 *
 * @param detail - 物品详情
 * @param zhRow - 中文索引
 * @param enRow - 英文索引
 * @param urlName - slug
 * @returns 是否套装
 */
function detectIsSet(
  detail: WfmItemDetail | null,
  zhRow: ItemIndexRowWithMeta | undefined,
  enRow: ItemIndexRowWithMeta | undefined,
  urlName: string,
): boolean {
  if (detail?.setRoot === true) {
    return true;
  }
  const tags = detail?.tags ?? zhRow?.tags ?? enRow?.tags ?? [];
  if (tags.includes('set')) {
    return true;
  }
  return /_set$/i.test(urlName);
}

/**
 * 按 WFM id 建索引映射。
 *
 * @param rows - 索引行
 * @returns id → 行
 */
function indexById(rows: ItemIndexRowWithMeta[]): Map<string, ItemIndexRowWithMeta> {
  const map = new Map<string, ItemIndexRowWithMeta>();
  for (const row of rows) {
    if (row.id) {
      map.set(row.id, row);
    }
  }
  return map;
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
  primary: ItemIndexRowWithMeta[],
  secondary: ItemIndexRowWithMeta[],
): ItemIndexRowWithMeta[] {
  const map = new Map<string, ItemIndexRowWithMeta>();
  for (const row of primary) {
    map.set(row.urlName, row);
  }
  for (const row of secondary) {
    const existing = map.get(row.urlName);
    if (!existing) {
      map.set(row.urlName, row);
      continue;
    }
    // 补缺 thumb / id / ducats / tags。
    map.set(row.urlName, {
      ...existing,
      thumb: existing.thumb ?? row.thumb,
      id: existing.id ?? row.id,
      ducats: existing.ducats ?? row.ducats ?? null,
      tags: existing.tags ?? row.tags,
    });
  }
  return [...map.values()];
}
