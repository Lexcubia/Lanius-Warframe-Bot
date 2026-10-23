import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import {
  renderFissuresCard,
  renderHelpCard,
  renderInvasionsCard,
  renderMarketCard,
  renderNightwaveCard,
  renderRivenCard,
  renderWorldstateCard,
} from './render-worldstate.js';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../tmp');

const sample = {
  realm: 'international' as const,
  fetchedAt: new Date().toISOString(),
  fissures: [
    {
      id: 'f1',
      era: 'lith' as const,
      eraLabel: { zh: '古纪', en: 'Lith' },
      missionTypeKey: 'MT_INTEL',
      missionType: { zh: '间谍', en: 'Spy' },
      node: { zh: 'Cambria（地球）', en: 'Cambria (Earth)' },
      path: 'normal' as const,
      pathLabel: { zh: '普通', en: 'Normal' },
      iconPath: '/Lotus/Interface/Icons/Relics/RelicLithA.png',
      iconUrl:
        'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Relics/RelicLithA.png',
      expiry: new Date(Date.now() + 3_600_000).toISOString(),
      remainingMs: 3_600_000,
    },
    {
      id: 'f2',
      era: 'axi' as const,
      eraLabel: { zh: '后纪', en: 'Axi' },
      missionTypeKey: 'MT_SURVIVAL',
      missionType: { zh: '生存', en: 'Survival' },
      node: { zh: 'Tikal（地球）', en: 'Tikal (Earth)' },
      path: 'steelPath' as const,
      pathLabel: { zh: '钢铁之路', en: 'Steel Path' },
      iconPath: '/Lotus/Interface/Icons/Relics/RelicAxiA.png',
      iconUrl:
        'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Relics/RelicAxiA.png',
      expiry: new Date(Date.now() + 2_400_000).toISOString(),
      remainingMs: 2_400_000,
    },
    {
      id: 'f3',
      era: 'meso' as const,
      eraLabel: { zh: '前纪', en: 'Meso' },
      missionTypeKey: 'Skirmish',
      missionType: { zh: '前哨战', en: 'Skirmish' },
      node: { zh: 'Ogal Cluster（地球）', en: 'Ogal Cluster (Earth)' },
      path: 'empyrean' as const,
      pathLabel: { zh: '九重天', en: 'Empyrean' },
      iconPath: '/Lotus/Interface/Icons/Relics/RelicMesoA.png',
      iconUrl:
        'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Relics/RelicMesoA.png',
      expiry: new Date(Date.now() + 1_200_000).toISOString(),
      remainingMs: 1_200_000,
    },
  ],
  cycles: [
    {
      id: 'earth' as const,
      name: { zh: '地球', en: 'Earth' },
      state: 'day',
      stateLabel: { zh: '白昼', en: 'Day' },
      expiry: new Date(Date.now() + 21 * 60_000).toISOString(),
      remainingMs: 21 * 60_000 + 43_000,
      progress: 0.55,
    },
    {
      id: 'cetus' as const,
      name: { zh: '希图斯（平原）', en: 'Cetus' },
      state: 'day',
      stateLabel: { zh: '白昼', en: 'Day' },
      expiry: new Date(Date.now() + 21 * 60_000).toISOString(),
      remainingMs: 21 * 60_000 + 43_000,
      progress: 0.55,
    },
    {
      id: 'cambion' as const,
      name: { zh: '魔胎之境', en: 'Cambion' },
      state: 'fass',
      stateLabel: { zh: 'Fass', en: 'Fass' },
      expiry: new Date(Date.now() + 21 * 60_000).toISOString(),
      remainingMs: 21 * 60_000 + 43_000,
      progress: 0.55,
    },
    {
      id: 'vallis' as const,
      name: { zh: '奥布山谷', en: 'Vallis' },
      state: 'cold',
      stateLabel: { zh: '寒冷', en: 'Cold' },
      expiry: new Date(Date.now() + 4 * 60_000).toISOString(),
      remainingMs: 4 * 60_000 + 2_000,
      progress: 0.7,
    },
    {
      id: 'duviri' as const,
      name: { zh: '双衍王境', en: 'Duviri' },
      state: 'anger',
      stateLabel: { zh: '愤怒', en: 'Anger' },
      expiry: new Date(Date.now() + 58 * 60_000).toISOString(),
      remainingMs: 58 * 60_000 + 6_000,
      progress: 0.35,
    },
    {
      id: 'zariman' as const,
      name: { zh: '扎里曼', en: 'Zariman' },
      state: 'corpus',
      stateLabel: { zh: 'Corpus', en: 'Corpus' },
      expiry: new Date(Date.now() + 71 * 60_000).toISOString(),
      remainingMs: 71 * 60_000,
      progress: 0.45,
    },
  ],
  invasions: [
    {
      id: '1',
      node: { zh: 'Draco（谷神星）', en: 'Draco (Ceres)' },
      attackingFaction: { zh: 'Corpus', en: 'Corpus' },
      defendingFaction: { zh: 'Grineer', en: 'Grineer' },
      completionPct: 18,
      expired: false,
      attackerReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCatalyst',
        name: { zh: 'Orokin 催化剂', en: 'Orokin Catalyst' },
        iconUrl:
          'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Store/OrokinCatalyst.png',
      },
      defenderReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/OrokinReactor',
        name: { zh: 'Orokin 反应堆', en: 'Orokin Reactor' },
        iconUrl:
          'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Store/OrokinReactor.png',
      },
    },
    {
      id: '2',
      node: { zh: 'Abaddon（欧罗巴）', en: 'Abaddon (Europa)' },
      attackingFaction: { zh: 'Grineer', en: 'Grineer' },
      defendingFaction: { zh: 'Corpus', en: 'Corpus' },
      completionPct: 53,
      expired: false,
    },
  ],
  nightwave: {
    season: 10,
    phase: 1,
    activeChallenges: [
      {
        id: 'd1',
        kind: 'daily' as const,
        kindLabel: { zh: '每日', en: 'Daily' },
        title: { zh: '每日 吸引力', en: 'Daily Attraction' },
        description: {
          zh: '使用磁力伤害击杀 150 名敌人',
          en: 'Kill 150 enemies with Magnetic damage',
        },
      },
      {
        id: 'w1',
        kind: 'weekly' as const,
        kindLabel: { zh: '每周', en: 'Weekly' },
        title: { zh: '屏住你的呼吸', en: 'Hold Your Breath' },
        description: {
          zh: '在赤毒生存任务中生存超过 20 分钟',
          en: 'Survive 20 minutes in Kuva Survival',
        },
      },
    ],
  },
};

const helpSample = {
  title: { zh: '命令帮助', en: 'Help' },
  intro: {
    zh: '以下为常用查询命令（示例数据）。',
    en: 'Common query commands (sample).',
  },
  lines: [
    {
      id: 'ws',
      command: '/世界状态',
      aliases: ['/ws'],
      summary: { zh: '开放世界周期', en: 'Open-world cycles' },
      usage: { zh: '/世界状态', en: '/worldstate' },
      params: [],
      examples: ['/世界状态'],
    },
    {
      id: 'fis',
      command: '/裂隙',
      aliases: ['/fissures'],
      summary: { zh: '虚空裂隙列表', en: 'Void fissures' },
      usage: { zh: '/裂隙', en: '/fissures' },
      params: [],
      examples: ['/裂隙'],
    },
  ],
};

const marketSample = {
  query: 'latron prime',
  resolved: {
    urlName: 'latron_prime_set',
    name: { zh: '拉特昂 Prime 一套', en: 'Latron Prime Set' },
    iconUrl:
      'https://warframe.market/static/assets/items/images/en/thumbs/latron_prime_set.5c8b8009acbdb97fd49177ba155ecfbe.128x128.png',
    ducats: 60,
    isSet: true,
    components: [
      {
        urlName: 'latron_prime_barrel',
        name: { zh: '拉特昂 Prime 枪管', en: 'Latron Prime Barrel' },
        iconUrl:
          'https://warframe.market/static/assets/items/images/en/thumbs/latron_prime_barrel.5c8b8009acbdb97fd49177ba155ecfbe.128x128.png',
        ducats: 15,
        quantityInSet: 1,
      },
      {
        urlName: 'latron_prime_receiver',
        name: { zh: '拉特昂 Prime 枪机', en: 'Latron Prime Receiver' },
        ducats: 15,
        quantityInSet: 1,
      },
      {
        urlName: 'latron_prime_stock',
        name: { zh: '拉特昂 Prime 枪托', en: 'Latron Prime Stock' },
        ducats: 15,
        quantityInSet: 1,
      },
      {
        urlName: 'latron_prime_blueprint',
        name: { zh: '拉特昂 Prime 蓝图', en: 'Latron Prime Blueprint' },
        ducats: 15,
        quantityInSet: 1,
      },
    ],
  },
  page: 1,
  pageSize: 10,
  total: 2,
  orders: [
    {
      platinum: 45,
      quantity: 1,
      modRank: null,
      seller: 'SellerA',
      sellerReputation: 42,
      status: 'ingame' as const,
      updatedAt: new Date().toISOString(),
    },
    {
      platinum: 48,
      quantity: 2,
      modRank: null,
      seller: 'SellerB',
      sellerReputation: 8,
      status: 'online' as const,
      updatedAt: new Date().toISOString(),
    },
  ],
  statusFilter: 'online|ingame' as const,
  sort: 'price_asc' as const,
  modRank: null,
  updatedAt: new Date().toISOString(),
};

const rivenSample = {
  query: 'lanka',
  resolved: {
    urlName: 'lanka',
    name: { zh: '兰卡', en: 'Lanka' },
    iconUrl: 'https://warframe.market/static/assets/items/images/en/thumbs/lanka.thumb.png',
  },
  page: 1,
  pageSize: 10,
  total: 1,
  orders: [
    {
      platinum: 180,
      attributes: [
        {
          urlName: 'critical_chance',
          name: { zh: '暴击几率', en: 'Critical Chance' },
          value: 18.6,
          positive: true,
        },
        {
          urlName: 'damage_vs_corpus',
          name: { zh: '对 Corpus 伤害', en: 'Damage to Corpus' },
          value: -6.2,
          positive: false,
        },
      ],
      mastery: 10,
      rank: 0,
      rerolls: 2,
      polarity: 'madurai',
      seller: 'RivenSeller',
      sellerReputation: 15,
      status: 'online' as const,
      updatedAt: new Date().toISOString(),
    },
  ],
  statusFilter: 'online|ingame' as const,
  sort: 'price_asc' as const,
  rank: null,
  mastery: null,
  minRerolls: null,
  maxRerolls: null,
  updatedAt: new Date().toISOString(),
};

describe('preview card write', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes module PNGs for visual inspection', async () => {
    mkdirSync(outDir, { recursive: true });
    const input = { locale: 'zh' as const, worldstate: sample };
    const cycles = await renderWorldstateCard(input);
    const fissures = await renderFissuresCard(input);
    const invasions = await renderInvasionsCard(input);
    const nightwave = await renderNightwaveCard(input);
    const help = await renderHelpCard({ locale: 'zh', help: helpSample });
    const market = await renderMarketCard({
      locale: 'zh',
      market: marketSample,
    });
    const riven = await renderRivenCard({ locale: 'zh', riven: rivenSample });

    writeFileSync(resolve(outDir, 'preview-worldstate.png'), cycles);
    writeFileSync(resolve(outDir, 'preview-fissures.png'), fissures);
    writeFileSync(resolve(outDir, 'preview-invasions.png'), invasions);
    writeFileSync(resolve(outDir, 'preview-nightwave.png'), nightwave);
    writeFileSync(resolve(outDir, 'preview-help.png'), help);
    writeFileSync(resolve(outDir, 'preview-market.png'), market);
    writeFileSync(resolve(outDir, 'preview-riven.png'), riven);
    // 兼容旧路径
    writeFileSync(resolve(outDir, 'preview.png'), cycles);

    expect(cycles.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(fissures.length).toBeGreaterThan(1000);
    expect(invasions.length).toBeGreaterThan(1000);
    expect(nightwave.length).toBeGreaterThan(1000);
    expect(help.length).toBeGreaterThan(1000);
    expect(market.length).toBeGreaterThan(1000);
    expect(riven.length).toBeGreaterThan(1000);
  }, 180_000);
});
