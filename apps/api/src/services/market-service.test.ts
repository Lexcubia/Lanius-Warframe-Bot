import { describe, expect, it } from 'vitest';

import type { WarframeMarketClient } from '../adapters/warframe-market/client.js';
import type { CacheStore } from '../cache/types.js';
import { MarketService } from './market-service.js';

/**
 * 简易内存缓存，满足服务层 getFresh/set。
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

describe('MarketService.searchOrders', () => {
  it('locks latron_prime_set for 拉特昂 / 拉特龙 aliases', async () => {
    const client = {
      async listItems(language: string) {
        if (language === 'en') {
          return [
            { url_name: 'latron_prime_set', item_name: 'Latron Prime Set' },
            { url_name: 'latron_wraith_set', item_name: 'Latron Wraith Set' },
            { url_name: 'latron_prime_barrel', item_name: 'Latron Prime Barrel' },
          ];
        }
        return [
          { url_name: 'latron_prime_set', item_name: '拉特昂 Prime 一套' },
          { url_name: 'latron_wraith_set', item_name: '拉特昂·亡魂 一套' },
          { url_name: 'latron_prime_barrel', item_name: '拉特昂 Prime 枪管' },
        ];
      },
      async listOrders() {
        return [
          {
            order_type: 'sell' as const,
            platinum: 50,
            quantity: 1,
            user: { ingame_name: 'A', status: 'online' },
          },
        ];
      },
    } as unknown as WarframeMarketClient;

    const service = new MarketService({
      cache: createMemoryCache(),
      client,
    });
    for (const query of ['拉特昂', '拉特龙']) {
      const page = await service.searchOrders({ query, page: 1, pageSize: 10 });
      expect(page.resolved.urlName).toBe('latron_prime_set');
    }
  });

  it('locks best item, filters sell+online, sorts asc, paginates 10', async () => {
    const client = {
      async listItems(language: string) {
        if (language === 'en') {
          return [
            { url_name: 'nova_prime_set', item_name: 'Nova Prime Set' },
            { url_name: 'nova_prime_blueprint', item_name: 'Nova Prime Blueprint' },
          ];
        }
        return [
          { url_name: 'nova_prime_set', item_name: 'Nova Prime 一套' },
          { url_name: 'nova_prime_blueprint', item_name: 'Nova Prime 蓝图' },
        ];
      },
      async listOrders() {
        return [
          {
            order_type: 'sell' as const,
            platinum: 90,
            quantity: 1,
            mod_rank: 0,
            user: { ingame_name: 'B', status: 'online' },
          },
          {
            order_type: 'sell' as const,
            platinum: 80,
            quantity: 2,
            mod_rank: 0,
            user: { ingame_name: 'A', status: 'ingame' },
          },
          {
            order_type: 'sell' as const,
            platinum: 70,
            quantity: 1,
            user: { ingame_name: 'Off', status: 'offline' },
          },
          {
            order_type: 'buy' as const,
            platinum: 60,
            quantity: 1,
            user: { ingame_name: 'Buyer', status: 'online' },
          },
          {
            order_type: 'sell' as const,
            platinum: 85,
            quantity: 1,
            mod_rank: 5,
            user: { ingame_name: 'Ranked', status: 'online' },
          },
        ];
      },
    } as unknown as WarframeMarketClient;

    const service = new MarketService({
      cache: createMemoryCache(),
      client,
    });

    const page1 = await service.searchOrders({
      query: 'nova prime',
      page: 1,
      pageSize: 10,
    });
    expect(page1.resolved.urlName).toBe('nova_prime_set');
    expect(page1.total).toBe(3);
    expect(page1.orders.map((o) => o.platinum)).toEqual([80, 85, 90]);
    expect(page1.orders[0]?.seller).toBe('A');

    const ranked = await service.searchOrders({
      query: 'nova prime',
      page: 1,
      pageSize: 10,
      modRank: 5,
    });
    expect(ranked.total).toBe(1);
    expect(ranked.orders[0]?.seller).toBe('Ranked');
  });

  it('throws when nothing matches', async () => {
    const client = {
      async listItems() {
        return [{ url_name: 'latron', item_name: '拉特龙' }];
      },
      async listOrders() {
        return [];
      },
    } as unknown as WarframeMarketClient;
    const service = new MarketService({
      cache: createMemoryCache(),
      client,
    });
    await expect(
      service.searchOrders({ query: 'zzzz-nope', page: 1, pageSize: 10 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
