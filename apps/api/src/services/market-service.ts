import type { MarketItemDto, MarketSearchDto } from '@lanius/core';

import { WarframeMarketClient } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { validationError } from '../lib/http-error.js';

const ITEMS_INDEX_TTL_MS = 6 * 60 * 60_000;
const ITEM_ORDERS_TTL_MS = 90_000;

/**
 * Warframe Market 物品行情服务。
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
   * 按关键词搜索物品并附带买卖价摘要。
   *
   * @param query - 用户查询串
   * @returns 搜索 DTO
   */
  async search(query: string): Promise<MarketSearchDto> {
    const q = query.trim();
    if (!q) {
      throw validationError('query is required');
    }

    const items = await this.getItemIndex();
    const needle = q.toLowerCase();
    const matched = items
      .filter(
        (item) =>
          item.url_name.toLowerCase().includes(needle) ||
          item.item_name.toLowerCase().includes(needle),
      )
      .slice(0, 5);

    const results: MarketItemDto[] = [];
    for (const item of matched) {
      results.push(await this.summarizeItem(item.url_name, item.item_name));
    }

    return { query: q, items: results };
  }

  /**
   * 读取（或刷新）物品索引。
   *
   * @returns 索引行
   */
  private async getItemIndex(): Promise<
    Array<{ url_name: string; item_name: string }>
  > {
    const key = 'wfm:items:index';
    const fresh = await this.cache.getFresh<
      Array<{ url_name: string; item_name: string }>
    >(key);
    if (fresh) {
      return fresh.value;
    }
    const items = await this.client.listItems();
    const slim = items.map((item) => ({
      url_name: item.url_name,
      item_name: item.item_name,
    }));
    await this.cache.set(key, slim, ITEMS_INDEX_TTL_MS);
    return slim;
  }

  /**
   * 汇总单物品买卖盘。
   *
   * @param urlName - slug
   * @param itemName - 展示名
   * @returns MarketItemDto
   */
  private async summarizeItem(
    urlName: string,
    itemName: string,
  ): Promise<MarketItemDto> {
    const key = `wfm:item:${urlName}`;
    const cached = await this.cache.getFresh<MarketItemDto>(key);
    if (cached) {
      return cached.value;
    }

    const orders = await this.client.listOrders(urlName);
    const online = orders.filter(
      (order) =>
        !order.user?.status ||
        order.user.status === 'ingame' ||
        order.user.status === 'online',
    );
    const sells = online
      .filter((order) => order.order_type === 'sell')
      .map((order) => order.platinum)
      .sort((a, b) => a - b);
    const buys = online
      .filter((order) => order.order_type === 'buy')
      .map((order) => order.platinum)
      .sort((a, b) => b - a);

    const dto: MarketItemDto = {
      urlName,
      name: { zh: itemName, en: itemName },
      lowestSell: sells[0] ?? null,
      highestBuy: buys[0] ?? null,
      volume: online.length,
      updatedAt: new Date().toISOString(),
    };
    await this.cache.set(key, dto, ITEM_ORDERS_TTL_MS);
    return dto;
  }
}
