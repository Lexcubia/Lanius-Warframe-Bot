import { EMPTY_WORLDSTATE_MISSION_SLICES } from '@lanius/core';
import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import {
  renderAlertsCard,
  renderArbitrationCard,
  renderArchimedeaCard,
  renderCircuitCard,
  renderFissuresCard,
  renderInvasionsCard,
  renderNightwaveCard,
  renderVarziaCard,
  renderVoidTraderCard,
  renderWeaponRotationCard,
  renderWorldstateCard,
} from './render-worldstate.js';

/** 1×1 透明 PNG data URL：测图标等待路径，不依赖外网 CDN */
const TINY_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const sampleWorldstate = {
  realm: 'international' as const,
  fetchedAt: '2026-10-10T12:00:00.000Z',
  ...EMPTY_WORLDSTATE_MISSION_SLICES,
  fissures: [
    {
      id: 'f1',
      era: 'lith' as const,
      eraLabel: { zh: '古纪', en: 'Lith' },
      missionTypeKey: 'MT_DEFENSE',
      missionType: { zh: '防御', en: 'Defense' },
      node: { zh: 'Lith（地球）', en: 'Lith (Earth)' },
      path: 'normal' as const,
      pathLabel: { zh: '普通', en: 'Normal' },
      iconPath: '/Lotus/Interface/Icons/Relics/RelicLithA.png',
      iconUrl:
        'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Relics/RelicLithA.png',
      expiry: '2026-10-10T13:00:00.000Z',
      remainingMs: 3_600_000,
    },
  ],
  cycles: [
    {
      id: 'earth' as const,
      name: { zh: '地球', en: 'Earth' },
      state: 'day',
      stateLabel: { zh: '白昼', en: 'Day' },
      expiry: '2026-10-10T13:00:00.000Z',
      remainingMs: 3_600_000,
      progress: 0.4,
    },
    {
      id: 'cetus' as const,
      name: { zh: '希图斯（平原）', en: 'Cetus' },
      state: 'day',
      stateLabel: { zh: '白昼', en: 'Day' },
      expiry: '2026-10-10T12:30:00.000Z',
      remainingMs: 1_800_000,
      progress: 0.5,
    },
    {
      id: 'cambion' as const,
      name: { zh: '魔胎之境', en: 'Cambion' },
      state: 'fass',
      stateLabel: { zh: 'Fass', en: 'Fass' },
      expiry: '2026-10-10T12:30:00.000Z',
      remainingMs: 1_800_000,
      progress: 0.5,
    },
    {
      id: 'vallis' as const,
      name: { zh: '奥布山谷', en: 'Vallis' },
      state: 'cold',
      stateLabel: { zh: '寒冷', en: 'Cold' },
      expiry: '2026-10-10T12:10:00.000Z',
      remainingMs: 600_000,
      progress: 0.3,
    },
    {
      id: 'duviri' as const,
      name: { zh: '双衍王境', en: 'Duviri' },
      state: 'anger',
      stateLabel: { zh: '愤怒', en: 'Anger' },
      expiry: '2026-10-10T13:00:00.000Z',
      remainingMs: 3_600_000,
      progress: 0.2,
    },
    {
      id: 'zariman' as const,
      name: { zh: '扎里曼', en: 'Zariman' },
      state: 'corpus',
      stateLabel: { zh: 'Corpus', en: 'Corpus' },
      expiry: '2026-10-10T14:00:00.000Z',
      remainingMs: 7_200_000,
      progress: 0.6,
    },
  ],
  invasions: [
    {
      id: '1',
      node: { zh: 'Galatea（海王星）', en: 'Galatea (Neptune)' },
      attackingFaction: { zh: 'Grineer', en: 'Grineer' },
      defendingFaction: { zh: 'Corpus', en: 'Corpus' },
      completionPct: 42,
      expired: false,
      attackerReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/ResourceNickname',
        name: { zh: '纳米孢子', en: 'Nano Spores' },
        iconUrl: TINY_ICON,
        quantity: 1500,
      },
      defenderReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/ResourceNickname2',
        name: { zh: '合金板', en: 'Alloy Plate' },
        iconUrl: TINY_ICON,
        quantity: 1,
      },
    },
  ],
  nightwave: {
    season: 3,
    phase: 1,
    activeChallenges: [
      {
        id: 'c1',
        kind: 'daily' as const,
        kindLabel: { zh: '每日', en: 'Daily' },
        title: { zh: '每日击杀', en: 'Daily Kill' },
      },
    ],
  },
  alerts: [
    {
      id: 'alert-1',
      tag: 'RoadToTauEvent',
      node: { zh: '测试节点（地球）', en: 'Test Node (Earth)' },
      missionType: { zh: '移动防御', en: 'Mobile Defense' },
      faction: { zh: 'Infested', en: 'Infested' },
      credits: 17000,
      expiry: '2099-01-01T00:00:00.000Z',
      rewards: [
        {
          uniqueName: '/Lotus/Types/Gameplay/Events/RoadToTauEvent/RoadToTauEventResource',
          name: { zh: '活动资源', en: 'Event Resource' },
          iconUrl: TINY_ICON,
          quantity: 50,
        },
      ],
    },
  ],
  arbitration: {
    nodeKey: 'SolNode64',
    node: { zh: 'Tessera（金星）', en: 'Tessera (Venus)' },
    missionTypeKey: 'Defense',
    missionType: { zh: '防御', en: 'Defense' },
    enemyKey: 'Corpus',
    enemy: { zh: 'Corpus', en: 'Corpus' },
    activation: '2026-10-10T11:00:00.000Z',
    expiry: '2026-10-10T12:00:00.000Z',
    source: 'warframestat',
  },
  circuit: {
    activation: '2026-10-19T00:00:00.000Z',
    expiry: '2026-10-26T00:00:00.000Z',
    normalChoices: [
      { key: 'Hydroid', name: { zh: '水刑天', en: 'Hydroid' } },
      { key: 'Mirage', name: { zh: '幻影', en: 'Mirage' } },
      { key: 'Limbo', name: { zh: '灵薄狱', en: 'Limbo' } },
    ],
    hardChoices: [
      { key: 'Dera', name: { zh: '德拉', en: 'Dera' } },
      { key: 'Cestra', name: { zh: '锡斯特', en: 'Cestra' } },
      { key: 'Okina', name: { zh: '奥金刀', en: 'Okina' } },
      { key: 'Sybaris', name: { zh: '席芭莉丝', en: 'Sybaris' } },
      { key: 'Sicarus', name: { zh: '席卡鲁斯', en: 'Sicarus' } },
    ],
  },
};

describe('module card renders', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('renders worldstate cycles PNG', async () => {
    const png = await renderWorldstateCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.length).toBeGreaterThan(1000);
  }, 60_000);

  it('renders fissures PNG', async () => {
    const png = await renderFissuresCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  }, 60_000);

  it('renders invasions PNG', async () => {
    const png = await renderInvasionsCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  }, 60_000);

  it('renders nightwave PNG', async () => {
    const png = await renderNightwaveCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  }, 60_000);

  it('renders alerts PNG with rows and empty state', async () => {
    const withData = await renderAlertsCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(withData.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(withData.length).toBeGreaterThan(1000);

    const empty = await renderAlertsCard({
      locale: 'zh',
      worldstate: { ...sampleWorldstate, alerts: [] },
    });
    expect(empty.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(empty.length).toBeGreaterThan(500);
  }, 60_000);

  it('renders arbitration PNG', async () => {
    const png = await renderArbitrationCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.length).toBeGreaterThan(1000);
  }, 60_000);

  it('renders archimedea PNG (empty-safe)', async () => {
    const png = await renderArchimedeaCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  }, 60_000);

  it('renders circuit PNG', async () => {
    const png = await renderCircuitCard({
      locale: 'zh',
      worldstate: sampleWorldstate,
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.length).toBeGreaterThan(1000);
  }, 60_000);

  it('renders void trader PNG', async () => {
    const png = await renderVoidTraderCard({
      locale: 'zh',
      voidTrader: {
        character: { zh: '虚空商人', en: 'Void Trader' },
        node: { zh: 'Larunda（水星）', en: 'Larunda (Mercury)' },
        active: true,
        activation: '2026-10-10T10:00:00.000Z',
        expiry: '2026-10-12T10:00:00.000Z',
        remainingMs: 86_400_000,
        inventory: [
          {
            uniqueName: '/Lotus/StoreItems/Types/Items/MiscItems/Foo',
            name: { zh: '测试商品', en: 'Test Wares' },
            iconUrl: TINY_ICON,
            ducats: 375,
            credits: 150_000,
          },
        ],
        fetchedAt: '2026-10-10T12:00:00.000Z',
      },
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.length).toBeGreaterThan(1000);
  }, 60_000);

  it('renders varzia PNG', async () => {
    const png = await renderVarziaCard({
      locale: 'zh',
      varzia: {
        character: { zh: '瓦奇娅', en: 'Varzia' },
        active: true,
        remainingMs: 3_600_000,
        inventory: [
          {
            uniqueName: '/Lotus/StoreItems/Types/Recipes/Warframe/Foo',
            name: { zh: '测试Prime', en: 'Test Prime' },
            iconUrl: TINY_ICON,
          },
        ],
        fetchedAt: '2026-10-10T12:00:00.000Z',
      },
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  }, 60_000);

  it('renders tenet rotation PNG', async () => {
    const png = await renderWeaponRotationCard({
      locale: 'zh',
      rotation: {
        kind: 'tenet',
        offerings: [
          {
            uniqueName: '/Lotus/Weapons/Corpus/LongGuns/TenetFluxRifle',
            name: { zh: '信条通量步枪', en: 'Tenet Flux Rifle' },
            iconUrl: TINY_ICON,
            element: 'magnetic',
            elementLabel: { zh: '磁力', en: 'Magnetic' },
            bonusPct: 42.5,
          },
        ],
        periodStart: '2026-10-01T00:00:00.000Z',
        periodEnd: '2026-10-08T00:00:00.000Z',
        remainingMs: 172_800_000,
        fetchedAt: '2026-10-10T12:00:00.000Z',
      },
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  }, 60_000);

  it('renders coda rotation PNG', async () => {
    const png = await renderWeaponRotationCard({
      locale: 'zh',
      rotation: {
        kind: 'coda',
        offerings: [
          {
            uniqueName: '/Lotus/Weapons/Infested/Kitgun/CodaCatabolyst',
            name: { zh: '终幕催化者', en: 'Coda Catabolyst' },
            iconUrl: TINY_ICON,
            element: 'toxin',
            elementLabel: { zh: '毒素', en: 'Toxin' },
            bonusPct: 55,
          },
        ],
        periodStart: '2026-10-01T00:00:00.000Z',
        periodEnd: '2026-10-08T00:00:00.000Z',
        remainingMs: 172_800_000,
        fetchedAt: '2026-10-10T12:00:00.000Z',
      },
    });
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  }, 60_000);
});
