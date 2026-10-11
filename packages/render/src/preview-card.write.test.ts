import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import {
  renderFissuresCard,
  renderInvasionsCard,
  renderNightwaveCard,
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
      defendingFaction: { zh: '格林尼尔', en: 'Grineer' },
      completionPct: 18,
      expired: false,
    },
    {
      id: '2',
      node: { zh: 'Abaddon（欧罗巴）', en: 'Abaddon (Europa)' },
      attackingFaction: { zh: '格林尼尔', en: 'Grineer' },
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
        title: { zh: '每日 吸引力', en: 'Daily Attraction' },
        description: {
          zh: '使用磁力伤害击杀 150 名敌人',
          en: 'Kill 150 enemies with Magnetic damage',
        },
      },
      {
        id: 'w1',
        title: { zh: '屏住你的呼吸', en: 'Hold Your Breath' },
        description: {
          zh: '在赤毒生存任务中生存超过 20 分钟',
          en: 'Survive 20 minutes in Kuva Survival',
        },
      },
    ],
  },
};

describe('preview card write', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it(
    'writes four module PNGs for visual inspection',
    async () => {
      mkdirSync(outDir, { recursive: true });
      const input = { locale: 'zh' as const, worldstate: sample };
      const cycles = await renderWorldstateCard(input);
      const fissures = await renderFissuresCard(input);
      const invasions = await renderInvasionsCard(input);
      const nightwave = await renderNightwaveCard(input);
      writeFileSync(resolve(outDir, 'preview-worldstate.png'), cycles);
      writeFileSync(resolve(outDir, 'preview-fissures.png'), fissures);
      writeFileSync(resolve(outDir, 'preview-invasions.png'), invasions);
      writeFileSync(resolve(outDir, 'preview-nightwave.png'), nightwave);
      // 兼容旧路径
      writeFileSync(resolve(outDir, 'preview.png'), cycles);
      expect(cycles.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(fissures.length).toBeGreaterThan(1000);
      expect(invasions.length).toBeGreaterThan(1000);
      expect(nightwave.length).toBeGreaterThan(1000);
    },
    120_000,
  );
});
