import type { RivenSearchDto, RivenSummaryDto } from '@lanius/core';

import { WarframeMarketClient } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { validationError } from '../lib/http-error.js';

const RIVEN_TTL_MS = 90_000;

/**
 * Warframe Market 紫卡价位服务。
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
   * 按武器名查询紫卡价位摘要。
   *
   * @param query - 武器名 / url_name
   * @returns 搜索 DTO
   */
  async search(query: string): Promise<RivenSearchDto> {
    const q = query.trim();
    if (!q) {
      throw validationError('query is required');
    }

    const weaponUrlName = toUrlName(q);
    const key = `wfm:riven:${weaponUrlName}`;
    const cached = await this.cache.getFresh<RivenSummaryDto>(key);
    if (cached) {
      return { query: q, results: [cached.value] };
    }

    const auctions = await this.client.searchRivenAuctions(weaponUrlName);
    const prices = auctions
      .map((row) => row.buyout_price ?? row.starting_price ?? row.top_bid)
      .filter((value): value is number => typeof value === 'number' && value > 0)
      .sort((a, b) => a - b);

    const summary: RivenSummaryDto = {
      weaponUrlName,
      weaponName: { zh: q, en: q },
      medianPlatinum: prices.length ? prices[Math.floor(prices.length / 2)]! : null,
      minPlatinum: prices[0] ?? null,
      maxPlatinum: prices.length ? prices[prices.length - 1]! : null,
      sampleCount: prices.length,
      updatedAt: new Date().toISOString(),
    };
    await this.cache.set(key, summary, RIVEN_TTL_MS);
    return { query: q, results: [summary] };
  }
}

/**
 * 将自由文本粗略转为 WFM url_name。
 *
 * @param input - 用户输入
 * @returns url_name
 */
function toUrlName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}
