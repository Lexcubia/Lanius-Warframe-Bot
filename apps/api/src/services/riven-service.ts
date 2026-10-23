import {
  MARKET_ORDERS_PAGE_SIZE,
  resolveBestItem,
  type ItemIndexRow,
  type MarketSellerStatus,
  type RivenAttributeDto,
  type RivenListingDto,
  type RivenOrdersDto,
} from '@lanius/core';

import { WarframeMarketClient, type WfmAuctionRow } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { notFoundError, validationError } from '../lib/http-error.js';

const RIVEN_ITEMS_TTL_MS = 6 * 60 * 60_000;
const RIVEN_AUCTIONS_TTL_MS = 90_000;

/**
 * 紫卡拍卖查询入参。
 */
export type RivenOrdersSearchInput = {
  /** 武器名关键词 */
  query: string;
  page: number;
  pageSize: number;
  /** 紫卡等级 */
  rank?: number;
  /** 段位 */
  mastery?: number;
  /** 最小循环（含） */
  minRerolls?: number;
  /** 最大循环（含） */
  maxRerolls?: number;
};

/**
 * Warframe Market 紫卡在线拍卖服务。
 */
export class RivenService {
  private readonly cache: CacheStore;
  private readonly client: WarframeMarketClient;

  /**
   * @param deps - 缓存与上游
   */
  constructor(deps: { cache: CacheStore; client?: WarframeMarketClient }) {
    this.cache = deps.cache;
    this.client = deps.client ?? new WarframeMarketClient();
  }

  /**
   * 中文/英文模糊锁定武器后，返回在线/游戏中紫卡拍卖（价升序分页）。
   *
   * @param input - 查询与筛选/分页
   * @returns 拍卖分页 DTO
   * @throws HttpError 空查询或未命中武器
   */
  async searchOrders(input: RivenOrdersSearchInput): Promise<RivenOrdersDto> {
    const q = input.query.trim();
    if (!q) {
      throw validationError('query is required');
    }

    const pageSize = Math.min(
      Math.max(1, input.pageSize || MARKET_ORDERS_PAGE_SIZE),
      MARKET_ORDERS_PAGE_SIZE,
    );
    const page = Math.max(1, input.page || 1);

    const zhIndex = await this.getRivenItemIndex('zh-hans');
    const hit = resolveBestItem(q, zhIndex);
    if (!hit) {
      throw notFoundError(`未匹配到紫卡武器：${q} / No riven weapon matched: ${q}`);
    }

    const enIndex = await this.getRivenItemIndex('en');
    const enName =
      enIndex.find((row) => row.urlName === hit.urlName)?.itemName ??
      hit.urlName.replace(/_/g, ' ');

    const listings = await this.loadAuctionListings(hit.urlName, {
      rank: input.rank,
      mastery: input.mastery,
    });

    const filtered = listings.filter((row) => {
      if (input.rank !== undefined && row.rank !== input.rank) {
        return false;
      }
      if (input.mastery !== undefined && row.mastery !== input.mastery) {
        return false;
      }
      if (input.minRerolls !== undefined && row.rerolls < input.minRerolls) {
        return false;
      }
      if (input.maxRerolls !== undefined && row.rerolls > input.maxRerolls) {
        return false;
      }
      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const orders = filtered.slice(start, start + pageSize);
    const updatedAt = new Date().toISOString();

    return {
      query: q,
      resolved: {
        urlName: hit.urlName,
        name: { zh: hit.itemName, en: enName },
      },
      page,
      pageSize,
      total,
      orders,
      statusFilter: 'online|ingame',
      sort: 'price_asc',
      rank: input.rank ?? null,
      mastery: input.mastery ?? null,
      minRerolls: input.minRerolls ?? null,
      maxRerolls: input.maxRerolls ?? null,
      updatedAt,
    };
  }

  /**
   * 读取可打紫卡物品索引（按语言缓存）。
   *
   * @param language - WFM Language
   * @returns 索引行
   */
  private async getRivenItemIndex(language: 'zh-hans' | 'en'): Promise<ItemIndexRow[]> {
    const key = `wfm:riven:items:${language}`;
    const fresh = await this.cache.getFresh<ItemIndexRow[]>(key);
    if (fresh) {
      return fresh.value;
    }
    const items = await this.client.listRivenItems(language);
    const slim: ItemIndexRow[] = items.map((item) => ({
      urlName: item.url_name,
      itemName: item.item_name,
    }));
    await this.cache.set(key, slim, RIVEN_ITEMS_TTL_MS);
    return slim;
  }

  /**
   * 拉取并缓存某武器的在线拍卖列表（价升序）。
   *
   * @param weaponUrlName - 武器 slug
   * @param upstreamFilter - 尽量透传给上游的 rank/mastery
   * @returns 规范化拍卖行
   */
  private async loadAuctionListings(
    weaponUrlName: string,
    upstreamFilter: { rank?: number; mastery?: number },
  ): Promise<RivenListingDto[]> {
    const filterKey = [upstreamFilter.rank ?? 'any', upstreamFilter.mastery ?? 'any'].join(':');
    const key = `wfm:riven:auctions:${weaponUrlName}:${filterKey}`;
    const cached = await this.cache.getFresh<RivenListingDto[]>(key);
    if (cached) {
      return cached.value;
    }

    const auctions = await this.client.searchRivenAuctions(weaponUrlName, {
      rank: upstreamFilter.rank,
      mastery: upstreamFilter.mastery,
    });

    const listings: RivenListingDto[] = [];
    for (const row of auctions) {
      const mapped = mapAuctionRow(row);
      if (mapped) {
        listings.push(mapped);
      }
    }

    listings.sort((a, b) => a.platinum - b.platinum || a.seller.localeCompare(b.seller));
    await this.cache.set(key, listings, RIVEN_AUCTIONS_TTL_MS);
    return listings;
  }
}

/**
 * 将上游拍卖行映射为 DTO；非在线或无有效价则丢弃。
 *
 * @param row - WFM 拍卖行
 * @returns 列表行或 null
 */
function mapAuctionRow(row: WfmAuctionRow): RivenListingDto | null {
  const owner = row.owner ?? row.user;
  const status = normalizeSellerStatus(owner?.status);
  if (!status) {
    return null;
  }

  const platinum = pickAuctionPrice(row);
  if (platinum === null) {
    return null;
  }

  const item = row.item;
  const attributes: RivenAttributeDto[] = (item?.attributes ?? [])
    .map((attr) => {
      const urlName = attr.url_name?.trim();
      if (!urlName || typeof attr.value !== 'number') {
        return null;
      }
      const label = urlName.replace(/_/g, ' ');
      return {
        urlName,
        name: { zh: label, en: label },
        value: attr.value,
        positive: attr.positive !== false,
      } satisfies RivenAttributeDto;
    })
    .filter((value): value is RivenAttributeDto => value !== null);

  return {
    platinum,
    attributes,
    mastery: typeof item?.mastery_level === 'number' ? item.mastery_level : 0,
    rank: typeof item?.mod_rank === 'number' ? item.mod_rank : 0,
    rerolls: typeof item?.re_rolls === 'number' ? item.re_rolls : 0,
    polarity: item?.polarity?.trim() || null,
    seller: owner?.ingame_name?.trim() || 'unknown',
    status,
    updatedAt: row.updated ? new Date(row.updated).toISOString() : new Date().toISOString(),
  };
}

/**
 * 选取拍卖展示价：买断 > 起拍 > 最高出价。
 *
 * @param row - 拍卖行
 * @returns 正数白金或 null
 */
function pickAuctionPrice(row: WfmAuctionRow): number | null {
  for (const candidate of [row.buyout_price, row.starting_price, row.top_bid]) {
    if (typeof candidate === 'number' && candidate > 0) {
      return candidate;
    }
  }
  return null;
}

/**
 * 仅保留明确 online / ingame。
 *
 * @param raw - 上游 status
 * @returns 状态或 null
 */
function normalizeSellerStatus(raw: string | undefined): MarketSellerStatus | null {
  if (raw === 'online' || raw === 'ingame') {
    return raw;
  }
  return null;
}
