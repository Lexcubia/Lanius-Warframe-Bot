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
  it('locks latron_prime_set for official WFM zh-hans 拉特昂 (not 拉特龙 alias)', async () => {
    const client = {
      async listItems(language: string) {
        if (language === 'en') {
          return [
            {
              url_name: 'latron_prime_set',
              item_name: 'Latron Prime Set',
              id: 'set-id',
              thumb: 'items/images/en/thumbs/latron_prime_set.png',
              ducats: 60,
              tags: ['set', 'prime'],
            },
            { url_name: 'latron_wraith_set', item_name: 'Latron Wraith Set', id: 'wraith' },
            {
              url_name: 'latron_prime_barrel',
              item_name: 'Latron Prime Barrel',
              id: 'barrel-id',
              ducats: 15,
              thumb: 'items/images/en/thumbs/latron_prime_barrel.png',
              subIcon: 'sub_icons/weapon/prime_barrel_128x128.png',
            },
          ];
        }
        return [
          {
            url_name: 'latron_prime_set',
            item_name: '拉特昂 Prime 一套',
            id: 'set-id',
            thumb: 'items/images/en/thumbs/latron_prime_set.png',
            ducats: 60,
            tags: ['set', 'prime'],
          },
          { url_name: 'latron_wraith_set', item_name: '拉特昂·亡魂 一套', id: 'wraith' },
          {
            url_name: 'latron_prime_barrel',
            item_name: '拉特昂 Prime 枪管',
            id: 'barrel-id',
            ducats: 15,
            thumb: 'items/images/en/thumbs/latron_prime_barrel.png',
            subIcon: 'sub_icons/weapon/prime_barrel_128x128.png',
          },
        ];
      },
      async getItem(urlName: string) {
        if (urlName === 'latron_prime_set') {
          return {
            url_name: 'latron_prime_set',
            item_name: '拉特昂 Prime 一套',
            id: 'set-id',
            ducats: 60,
            setRoot: true,
            tags: ['set', 'prime'],
            setParts: ['barrel-id', 'set-id'],
          };
        }
        if (urlName === 'latron_prime_barrel') {
          return {
            url_name: 'latron_prime_barrel',
            item_name: '拉特昂 Prime 枪管',
            id: 'barrel-id',
            ducats: 15,
            quantityInSet: 1,
            tags: ['component', 'prime'],
            thumb: 'items/images/en/thumbs/latron_prime_barrel.png',
            subIcon: 'sub_icons/weapon/prime_barrel_128x128.png',
          };
        }
        return {
          url_name: urlName,
          item_name: urlName,
          ducats: null,
        };
      },
      async listOrders() {
        return [
          {
            order_type: 'sell' as const,
            platinum: 50,
            quantity: 1,
            user: { ingame_name: 'A', status: 'online', reputation: 12 },
          },
        ];
      },
    } as unknown as WarframeMarketClient;

    const service = new MarketService({
      cache: createMemoryCache(),
      client,
    });
    const page = await service.searchOrders({ query: '拉特昂', page: 1, pageSize: 10 });
    expect(page.resolved.urlName).toBe('latron_prime_set');
    expect(page.resolved.iconUrl).toContain('warframe.market/static/assets/');
    expect(page.resolved.ducats).toBe(60);
    expect(page.resolved.isSet).toBe(true);
    expect(page.resolved.components).toEqual([
      expect.objectContaining({
        urlName: 'latron_prime_barrel',
        ducats: 15,
        quantityInSet: 1,
        name: { zh: '拉特昂 Prime 枪管', en: 'Latron Prime Barrel' },
        iconUrl: expect.stringContaining('sub_icons/weapon/prime_barrel_128x128.png'),
      }),
    ]);
    expect(page.resolved.iconUrl).toContain('latron_prime_set');
    expect(page.resolved.components?.[0]?.iconUrl).not.toContain('latron_prime_set');
    expect(page.orders[0]?.sellerReputation).toBe(12);
    await expect(
      service.searchOrders({ query: '拉特龙', page: 1, pageSize: 10 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('locks best item, filters sell+online, sorts asc, paginates 10', async () => {
    const client = {
      async listItems(language: string) {
        if (language === 'en') {
          return [
            {
              url_name: 'nova_prime_set',
              item_name: 'Nova Prime Set',
              id: 'nova-set',
              ducats: 105,
              tags: ['set'],
            },
            { url_name: 'nova_prime_blueprint', item_name: 'Nova Prime Blueprint', id: 'nova-bp' },
          ];
        }
        return [
          {
            url_name: 'nova_prime_set',
            item_name: 'Nova Prime 一套',
            id: 'nova-set',
            ducats: 105,
            tags: ['set'],
          },
          { url_name: 'nova_prime_blueprint', item_name: 'Nova Prime 蓝图', id: 'nova-bp' },
        ];
      },
      async getItem(urlName: string) {
        return {
          url_name: urlName,
          item_name: urlName,
          id: urlName === 'nova_prime_set' ? 'nova-set' : 'nova-bp',
          ducats: urlName === 'nova_prime_set' ? 105 : null,
          setRoot: urlName === 'nova_prime_set',
          tags: urlName === 'nova_prime_set' ? ['set'] : [],
          setParts: urlName === 'nova_prime_set' ? ['nova-set'] : undefined,
        };
      },
      async listOrders() {
        return [
          {
            order_type: 'sell' as const,
            platinum: 90,
            quantity: 1,
            mod_rank: 0,
            user: { ingame_name: 'B', status: 'online', reputation: 3 },
          },
          {
            order_type: 'sell' as const,
            platinum: 80,
            quantity: 2,
            mod_rank: 0,
            user: { ingame_name: 'A', status: 'ingame', reputation: 9 },
          },
          {
            order_type: 'sell' as const,
            platinum: 70,
            quantity: 1,
            user: { ingame_name: 'Off', status: 'offline', reputation: 1 },
          },
          {
            order_type: 'buy' as const,
            platinum: 60,
            quantity: 1,
            user: { ingame_name: 'Buyer', status: 'online', reputation: 2 },
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
    expect(page1.resolved.ducats).toBe(105);
    expect(page1.total).toBe(3);
    expect(page1.orders.map((o) => o.platinum)).toEqual([80, 85, 90]);
    expect(page1.orders[0]?.seller).toBe('A');
    expect(page1.orders[0]?.sellerReputation).toBe(9);
    expect(page1.orders[1]?.sellerReputation).toBe(0);

    const ranked = await service.searchOrders({
      query: 'nova prime',
      page: 1,
      pageSize: 10,
      modRank: 5,
    });
    expect(ranked.total).toBe(1);
    expect(ranked.orders[0]?.seller).toBe('Ranked');
  });

  it('exposes ducats for prime part without set components', async () => {
    const client = {
      async listItems(language: string) {
        const row = {
          url_name: 'latron_prime_barrel',
          item_name: language === 'en' ? 'Latron Prime Barrel' : '拉特昂 Prime 枪管',
          id: 'barrel-id',
          ducats: 15,
          tags: ['component', 'prime'],
        };
        return [row];
      },
      async getItem() {
        return {
          url_name: 'latron_prime_barrel',
          item_name: '拉特昂 Prime 枪管',
          id: 'barrel-id',
          ducats: 15,
          setRoot: false,
          tags: ['component', 'prime'],
        };
      },
      async listOrders() {
        return [
          {
            order_type: 'sell' as const,
            platinum: 20,
            quantity: 3,
            user: { ingame_name: 'P', status: 'online', reputation: 5 },
          },
        ];
      },
    } as unknown as WarframeMarketClient;

    const service = new MarketService({ cache: createMemoryCache(), client });
    const page = await service.searchOrders({ query: '枪管', page: 1, pageSize: 10 });
    expect(page.resolved.urlName).toBe('latron_prime_barrel');
    expect(page.resolved.ducats).toBe(15);
    expect(page.resolved.isSet).toBe(false);
    expect(page.resolved.components).toBeUndefined();
  });

  it('throws when nothing matches', async () => {
    const client = {
      async listItems() {
        return [{ url_name: 'latron', item_name: '拉特龙' }];
      },
      async getItem() {
        return { url_name: 'latron', item_name: '拉特龙', ducats: null };
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
