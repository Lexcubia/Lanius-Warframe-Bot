import { describe, expect, it, vi } from 'vitest';

import { WarframeMarketClient, resolveWfmV2BaseUrl } from './client.js';

describe('resolveWfmV2BaseUrl', () => {
  it('upgrades legacy v1 config roots to v2', () => {
    expect(resolveWfmV2BaseUrl('https://api.warframe.market/v1')).toBe(
      'https://api.warframe.market/v2',
    );
    expect(resolveWfmV2BaseUrl('https://api.warframe.market/v1/')).toBe(
      'https://api.warframe.market/v2',
    );
    expect(resolveWfmV2BaseUrl('https://api.warframe.market/v2')).toBe(
      'https://api.warframe.market/v2',
    );
  });
});

describe('WarframeMarketClient v2 mapping', () => {
  it('listItems reads slug + i18n name from v2 payload', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(String(url)).toContain('/v2/items');
      return new Response(
        JSON.stringify({
          apiVersion: '0.25.0',
          data: [
            {
              slug: 'primed_continuity',
              i18n: {
                'zh-hans': { name: 'Primed 持续力' },
                en: { name: 'Primed Continuity' },
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const client = new WarframeMarketClient({
      baseUrl: 'https://api.warframe.market/v1',
      fetchImpl,
    });
    const rows = await client.listItems('zh-hans');
    expect(rows).toEqual([{ url_name: 'primed_continuity', item_name: 'Primed 持续力' }]);
  });

  it('listItems keeps thumb from i18n', async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: [
            {
              slug: 'latron_prime_set',
              i18n: {
                'zh-hans': {
                  name: '拉特昂 Prime 一套',
                  thumb: 'items/images/en/thumbs/latron_prime_set.png',
                },
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const client = new WarframeMarketClient({ fetchImpl });
    const rows = await client.listItems('zh-hans');
    expect(rows[0]?.thumb).toBe('items/images/en/thumbs/latron_prime_set.png');
  });

  it('listRivenAttributes reads zh-hans names', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toContain('/v2/riven/attributes');
      expect((init?.headers as Record<string, string>).Language).toBe('zh-hans');
      return new Response(
        JSON.stringify({
          data: [
            {
              slug: 'damage_vs_corpus',
              i18n: {
                'zh-hans': { name: '对 Corpus 伤害' },
                en: { name: 'Damage to Corpus' },
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const client = new WarframeMarketClient({ fetchImpl });
    const rows = await client.listRivenAttributes('zh-hans');
    expect(rows[0]).toEqual({
      url_name: 'damage_vs_corpus',
      item_name: '对 Corpus 伤害',
    });
  });

  it('listOrders maps camelCase user fields and rank', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(String(url)).toContain('/v2/orders/item/primed_continuity?platform=pc');
      return new Response(
        JSON.stringify({
          data: [
            {
              type: 'sell',
              platinum: 45,
              quantity: 2,
              rank: 10,
              updatedAt: '2026-10-03T02:58:54Z',
              user: { ingameName: 'SellerA', status: 'ingame' },
            },
            {
              type: 'buy',
              platinum: 40,
              quantity: 1,
              user: { ingameName: 'Buyer', status: 'online' },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const client = new WarframeMarketClient({ fetchImpl });
    const orders = await client.listOrders('primed_continuity');
    expect(orders).toEqual([
      {
        order_type: 'sell',
        platinum: 45,
        quantity: 2,
        mod_rank: 10,
        last_update: '2026-10-03T02:58:54Z',
        user: { ingame_name: 'SellerA', status: 'ingame' },
      },
      {
        order_type: 'buy',
        platinum: 40,
        quantity: 1,
        mod_rank: null,
        last_update: undefined,
        user: { ingame_name: 'Buyer', status: 'online' },
      },
    ]);
  });

  it('listRivenItems hits /riven/weapons', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(String(url)).toContain('/v2/riven/weapons');
      return new Response(
        JSON.stringify({
          data: [
            {
              slug: 'latron',
              i18n: {
                'zh-hans': { name: '拉特昂' },
                en: { name: 'Latron' },
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const client = new WarframeMarketClient({ fetchImpl });
    const rows = await client.listRivenItems('zh-hans');
    expect(rows[0]).toEqual({ url_name: 'latron', item_name: '拉特昂' });
  });

  it('searchRivenAuctions still calls v1 auctions path', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(String(url)).toContain('/v1/auctions/search?');
      expect(String(url)).toContain('weapon_url_name=latron');
      return new Response(JSON.stringify({ payload: { auctions: [{ buyout_price: 100 }] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const client = new WarframeMarketClient({ fetchImpl });
    const rows = await client.searchRivenAuctions('latron');
    expect(rows).toHaveLength(1);
  });
});
