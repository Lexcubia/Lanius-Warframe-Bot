import { describe, expect, it } from 'vitest';

import { openLaniusDb } from '../db/client.js';
import { upsertSubscription } from '../db/subscriptions.js';
import { PushService } from './push-service.js';

/**
 * 构造最小 WorldstateService / Trader / Rotation mock。
 *
 * @returns PushService 可注入依赖
 */
function createPushServiceWithMocks() {
  const db = openLaniusDb(':memory:');
  const ws = {
    fissures: [
      {
        id: 'f1',
        era: 'lith' as const,
        eraLabel: { zh: '古纪', en: 'Lith' },
        missionTypeKey: 'MT_EXTERMINATION',
        missionType: { zh: '歼灭', en: 'Exterminate' },
        node: { zh: '节点', en: 'Node' },
        path: 'normal' as const,
        pathLabel: { zh: '普通', en: 'Normal' },
        iconPath: '/x.png',
        iconUrl: 'https://example.com/x.png',
        expiry: '2099-01-01T00:00:00.000Z',
        remainingMs: 3_600_000,
      },
    ],
    cycles: [
      {
        id: 'cetus' as const,
        name: { zh: '夜灵平野', en: 'Cetus' },
        state: 'night',
        stateLabel: { zh: '夜晚', en: 'Night' },
        expiry: '2099-01-01T00:00:00.000Z',
        remainingMs: 1_800_000,
        progress: 0.5,
      },
    ],
    invasions: [],
    nightwave: null,
    sortie: { id: 'sortie-1', missions: [] },
    archon: null,
    circuit: null,
    bounties: [],
    arbitration: null,
    alerts: [],
    archimedea: null,
    dailyDeals: [],
    news: [],
    kuva: null,
    synthTargets: [],
    construction: null,
    voidStorms: [],
    events: [],
    conclave: [],
    clanRewards: [],
    flashSales: [],
    calendar1999: null,
    descendia: null,
    realm: 'international' as const,
    fetchedAt: new Date().toISOString(),
  };

  const worldstateService = {
    getWorldstate: async () => ({
      data: ws,
      cached: false,
      cacheAgeMs: 0,
      stale: false,
      source: 'test',
    }),
    getSteelPathShop: () => ({
      kind: 'steelPath' as const,
      fetchedAt: new Date().toISOString(),
      weekly: [{ name: { zh: '测试', en: 'Test' }, cost: 15 }],
      evergreen: [],
    }),
    getSliverShop: () => ({
      kind: 'sliverShop' as const,
      fetchedAt: new Date().toISOString(),
      nextReset: '2099-01-06T00:00:00.000Z',
      weekly: [],
      evergreen: [],
    }),
    getIncarnon: () => ({
      fetchedAt: new Date().toISOString(),
      weekIndex: 1,
      weekTotal: 9,
      current: [{ name: { zh: '布拉蒙', en: 'Braton' } }],
      next: [],
    }),
    getIncursions: async () => ({
      fetchedAt: new Date().toISOString(),
      nodes: [{ nodeKey: 'SolNode1', node: { zh: '节点1', en: 'Node1' } }],
    }),
  };

  const traderService = {
    getVoidTrader: async () => ({
      data: {
        character: { zh: '巴罗', en: 'Baro' },
        node: { zh: '中枢', en: 'Relay' },
        active: true,
        remainingMs: 3_600_000,
        inventory: [],
        expiry: '2099-01-01T00:00:00.000Z',
      },
    }),
    getVarzia: async () => ({
      data: {
        character: { zh: '瓦奇娅', en: 'Varzia' },
        active: true,
        inventory: [],
      },
    }),
  };

  const rotationService = {
    getRotation: async (kind: 'tenet' | 'coda') => ({
      kind,
      periodEnd: '2099-01-01T00:00:00.000Z',
      remainingMs: 86_400_000,
      offerings: [{ name: { zh: '武器', en: 'Weapon' } }],
    }),
  };

  const service = new PushService({
    db,
    worldstateService: worldstateService as never,
    traderService: traderService as never,
    rotationService: rotationService as never,
    realm: 'international',
    locale: 'zh',
  });

  return { db, service, ws };
}

describe('PushService Wave4', () => {
  it('collects due on_change for fissures and cetus cycle filter', async () => {
    const { db, service } = createPushServiceWithMocks();
    upsertSubscription(db, {
      scene: 'group',
      targetId: 'g1',
      moduleId: 'fissures',
      frequency: 'on_change',
    });
    upsertSubscription(db, {
      scene: 'group',
      targetId: 'g1',
      moduleId: 'worldstate',
      filterArgs: 'cetus',
      frequency: 'on_change',
    });
    upsertSubscription(db, {
      scene: 'group',
      targetId: 'g1',
      moduleId: 'sortie',
      frequency: 'on_change',
    });

    const due = await service.collectDue();
    const modules = due.map((d) => d.moduleId).sort();
    expect(modules).toEqual(['fissures', 'sortie', 'worldstate']);
    expect(due.every((d) => d.text.includes('【Lanius'))).toBe(true);

    for (const row of due) {
      service.acknowledge(row.subscriptionId, row.fingerprint);
    }
    const again = await service.collectDue();
    expect(again).toHaveLength(0);
  });

  it('applies fissure filterArgs to fingerprint text', async () => {
    const { db, service } = createPushServiceWithMocks();
    upsertSubscription(db, {
      scene: 'c2c',
      targetId: 'u1',
      moduleId: 'fissures',
      filterArgs: '钢铁',
      frequency: 'on_change',
    });
    const due = await service.collectDue();
    expect(due).toHaveLength(1);
    expect(due[0]?.text).toContain('筛选：钢铁');
    // 钢铁筛选下普通裂隙被滤空
    expect(due[0]?.text).toContain('暂无活跃裂隙');
  });
});
