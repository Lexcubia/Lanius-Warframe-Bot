import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import {
  renderHelpCard,
  renderInvasionsCard,
  renderMarketCard,
  renderRivenCard,
} from './render-worldstate.js';
import type { CardSkinId } from './vue-cards/skins.js';

/**
 * dense 预览输出目录。
 * 默认写仓库内 `packages/render/tmp/qq-cards-dense`（已 gitignore），保证 CI 可写。
 * 本地可设 `LANIUS_QQ_CARD_PREVIEW_DIR`（或兼容旧名 `LANIUS_DENSE_PREVIEW_DIR`）指向 agent store。
 *
 * @returns 绝对路径
 */
function resolveDensePreviewDir(): string {
  const fromEnv =
    process.env.LANIUS_QQ_CARD_PREVIEW_DIR?.trim() || process.env.LANIUS_DENSE_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/qq-cards-dense');
}

const outDir = resolveDensePreviewDir();

const sampleWorldstate = {
  realm: 'international' as const,
  fetchedAt: new Date().toISOString(),
  fissures: [],
  cycles: [],
  invasions: [
    {
      id: 'inv1',
      node: { zh: 'Ariel（乌拉努斯）', en: 'Ariel (Uranus)' },
      attackingFaction: { zh: 'Infested', en: 'Infested' },
      defendingFaction: { zh: 'Corpus', en: 'Corpus' },
      attackerReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/MutagenMass',
        name: { zh: '突变原聚合物', en: 'Mutagen Mass' },
        iconUrl:
          'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/StoreItems/Resources/ChemicalComponent.png',
        quantity: 3,
      },
      defenderReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/Fieldron',
        name: { zh: '磁场碎裂器', en: 'Fieldron' },
        iconUrl:
          'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/StoreItems/Resources/Fieldron.png',
        quantity: 1,
      },
      completionPct: 62,
      expired: false,
    },
    {
      id: 'inv2',
      node: { zh: 'Tessera（金星）', en: 'Tessera (Venus)' },
      attackingFaction: { zh: 'Grineer', en: 'Grineer' },
      defendingFaction: { zh: 'Corpus', en: 'Corpus' },
      attackerReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/NanoSpores',
        name: { zh: '纳米孢子', en: 'Nano Spores' },
        quantity: 1500,
      },
      defenderReward: {
        uniqueName: '/Lotus/Types/Items/MiscItems/UtilityUnlocker',
        name: { zh: '飞扬', en: 'Exilus Adapter' },
      },
      completionPct: 28,
      expired: false,
    },
  ],
  nightwave: null,
};

const helpSample = {
  title: { zh: 'Lanius 帮助', en: 'Lanius Help' },
  intro: { zh: '指令总览（点模块看详解）', en: 'Command overview' },
  lines: [
    {
      id: 'worldstate',
      command: '/世界状态',
      aliases: ['/ws'],
      summary: { zh: '开放世界周期', en: 'Open-world cycles' },
      usage: { zh: '/世界状态', en: '/worldstate' },
      params: [],
      examples: [],
    },
    {
      id: 'fissures',
      command: '/裂隙',
      aliases: ['/fissures'],
      summary: { zh: '虚空裂隙', en: 'Fissures' },
      usage: { zh: '/裂隙', en: '/fissures' },
      params: [],
      examples: [],
    },
    {
      id: 'market',
      command: '/wm',
      aliases: ['/市场'],
      summary: { zh: '市场卖单', en: 'Market' },
      usage: { zh: '/wm <物品>', en: '/wm <item>' },
      params: [],
      examples: [],
    },
    {
      id: 'riven',
      command: '/zk',
      aliases: ['/紫卡'],
      summary: { zh: '紫卡拍卖', en: 'Riven' },
      usage: { zh: '/zk <武器>', en: '/zk <weapon>' },
      params: [],
      examples: [],
    },
    {
      id: 'mode',
      command: '/模式',
      aliases: ['/mode'],
      summary: { zh: '回复模式', en: 'Reply mode' },
      usage: { zh: '/模式 <文本|图片>', en: '/mode <text|image>' },
      params: [],
      examples: [],
    },
    {
      id: 'help',
      command: '/帮助',
      aliases: ['/help'],
      summary: { zh: '帮助', en: 'Help' },
      usage: { zh: '/帮助', en: '/help' },
      params: [],
      examples: [],
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

describe('dense QQ card previews (light/dark)', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes market/help/invasions/riven PNGs for both skins', async () => {
    mkdirSync(outDir, { recursive: true });
    const skins: CardSkinId[] = ['light', 'dark'];

    for (const skin of skins) {
      const market = await renderMarketCard({ locale: 'zh', market: marketSample, skin });
      const help = await renderHelpCard({ locale: 'zh', help: helpSample, skin });
      const invasions = await renderInvasionsCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
        skin,
      });
      const riven = await renderRivenCard({ locale: 'zh', riven: rivenSample, skin });

      writeFileSync(resolve(outDir, `market-${skin}.png`), market);
      writeFileSync(resolve(outDir, `help-${skin}.png`), help);
      writeFileSync(resolve(outDir, `invasions-${skin}.png`), invasions);
      writeFileSync(resolve(outDir, `riven-${skin}.png`), riven);

      expect(market.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(help.length).toBeGreaterThan(1000);
      expect(invasions.length).toBeGreaterThan(1000);
      expect(riven.length).toBeGreaterThan(1000);
    }
  }, 240_000);
});
