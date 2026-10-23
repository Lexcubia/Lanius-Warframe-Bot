import { describe, expect, it } from 'vitest';

import type { WarframeMarketClient } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { RivenService } from './riven-service.js';

/**
 * 简易内存缓存。
 *
 * @returns CacheStore 替身
 */
function createMemoryCache(): CacheStore {
  const store = new Map<string, { value: unknown; expiresAt: number }>();
  return {
    async set(key: string, value: unknown, ttlMs: number) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    async getFresh<T>(key: string) {
      const hit = store.get(key);
      if (!hit || hit.expiresAt <= Date.now()) {
        return undefined;
      }
      return { value: hit.value as T, ageMs: 0, stale: false };
    },
    async getIncludingStale() {
      return undefined;
    },
    async has() {
      return false;
    },
    async ping() {
      return 'ok' as const;
    },
    async close() {},
  };
}

/**
 * 属性目录替身（中英文）。
 *
 * @param language - WFM Language
 * @returns 属性行
 */
async function stubAttributes(language: string) {
  if (language === 'en') {
    return [
      { url_name: 'critical_chance', item_name: 'Critical Chance' },
      { url_name: 'damage_vs_corpus', item_name: 'Damage to Corpus' },
    ];
  }
  return [
    { url_name: 'critical_chance', item_name: '暴击几率' },
    { url_name: 'damage_vs_corpus', item_name: '对 Corpus 伤害' },
  ];
}

describe('RivenService.searchOrders', () => {
  it('locks latron for official WFM zh-hans 拉特昂 and en slug (not 拉特龙)', async () => {
    const client = {
      async listRivenItems(language: string) {
        if (language === 'en') {
          return [{ url_name: 'latron', item_name: 'Latron' }];
        }
        return [{ url_name: 'latron', item_name: '拉特昂' }];
      },
      listRivenAttributes: stubAttributes,
      async searchRivenAuctions(weapon: string) {
        expect(weapon).toBe('latron');
        return [
          {
            buyout_price: 100,
            owner: { ingame_name: 'S', status: 'online' },
            item: { mod_rank: 0, re_rolls: 0, mastery_level: 8, attributes: [] },
          },
        ];
      },
    } as unknown as WarframeMarketClient;

    const service = new RivenService({
      cache: createMemoryCache(),
      client,
    });
    for (const query of ['拉特昂', 'latron']) {
      const result = await service.searchOrders({ query, page: 1, pageSize: 10 });
      expect(result.resolved.urlName).toBe('latron');
      expect(result.total).toBe(1);
    }
    await expect(
      service.searchOrders({ query: '拉特龙', page: 1, pageSize: 10 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('maps localized attributes/mastery/rank/rerolls and filters seller status', async () => {
    const client = {
      async listRivenItems(language: string) {
        if (language === 'en') {
          return [{ url_name: 'latron', item_name: 'Latron' }];
        }
        return [{ url_name: 'latron', item_name: '拉特昂' }];
      },
      listRivenAttributes: stubAttributes,
      async searchRivenAuctions() {
        return [
          {
            buyout_price: 200,
            owner: { ingame_name: 'SellerA', status: 'online' },
            item: {
              weapon_url_name: 'latron',
              mod_rank: 0,
              re_rolls: 2,
              mastery_level: 8,
              polarity: 'madurai',
              attributes: [
                { url_name: 'critical_chance', value: 18.6, positive: true },
                { url_name: 'damage_vs_corpus', value: -6.2, positive: false },
              ],
            },
          },
          {
            buyout_price: 150,
            owner: { ingame_name: 'Offline', status: 'offline' },
            item: { mod_rank: 0, re_rolls: 0, mastery_level: 8, attributes: [] },
          },
          {
            starting_price: 180,
            owner: { ingame_name: 'SellerB', status: 'ingame' },
            item: {
              mod_rank: 8,
              re_rolls: 5,
              mastery_level: 12,
              attributes: [],
            },
          },
        ];
      },
    } as unknown as WarframeMarketClient;

    const service = new RivenService({
      cache: createMemoryCache(),
      client,
    });

    const result = await service.searchOrders({
      query: '拉特昂',
      page: 1,
      pageSize: 10,
    });
    expect(result.resolved.urlName).toBe('latron');
    expect(result.total).toBe(2);
    expect(result.orders[0]?.platinum).toBe(180);
    expect(result.orders[1]?.attributes).toHaveLength(2);
    expect(result.orders[1]?.attributes[0]?.name.zh).toBe('暴击几率');
    expect(result.orders[1]?.attributes[1]?.name.zh).toBe('对 Corpus 伤害');
    expect(result.orders[1]?.rerolls).toBe(2);

    const filtered = await service.searchOrders({
      query: '拉特昂',
      page: 1,
      pageSize: 10,
      rank: 0,
      mastery: 8,
      minRerolls: 1,
      maxRerolls: 3,
    });
    expect(filtered.total).toBe(1);
    expect(filtered.orders[0]?.seller).toBe('SellerA');
  });
});
