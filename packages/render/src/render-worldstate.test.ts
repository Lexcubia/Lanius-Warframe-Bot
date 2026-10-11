import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import {
  renderFissuresCard,
  renderInvasionsCard,
  renderNightwaveCard,
  renderWorldstateCard,
} from './render-worldstate.js';

const sampleWorldstate = {
  realm: 'international' as const,
  fetchedAt: '2026-10-10T12:00:00.000Z',
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
};

describe('module card renders', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it(
    'renders worldstate cycles PNG',
    async () => {
      const png = await renderWorldstateCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
      });
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.length).toBeGreaterThan(1000);
    },
    60_000,
  );

  it(
    'renders fissures PNG',
    async () => {
      const png = await renderFissuresCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
      });
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    },
    60_000,
  );

  it(
    'renders invasions PNG',
    async () => {
      const png = await renderInvasionsCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
      });
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    },
    60_000,
  );

  it(
    'renders nightwave PNG',
    async () => {
      const png = await renderNightwaveCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
      });
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    },
    60_000,
  );
});
