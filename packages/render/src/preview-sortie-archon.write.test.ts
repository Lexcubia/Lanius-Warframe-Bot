import { EMPTY_WORLDSTATE_MISSION_SLICES } from '@lanius/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderArchonCard, renderSortieCard } from './render-worldstate.js';

/**
 * 突击 / 执行官预览输出目录。
 * 默认写仓库 `packages/render/tmp/ws-sortie-archon`；可用
 * `LANIUS_SORTIE_ARCHON_PREVIEW_DIR` 指向 agent store media。
 *
 * @returns 绝对路径
 */
function resolvePreviewDir(): string {
  const fromEnv = process.env.LANIUS_SORTIE_ARCHON_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/ws-sortie-archon');
}

const outDir = resolvePreviewDir();

const sampleWorldstate = {
  realm: 'international' as const,
  fetchedAt: new Date().toISOString(),
  ...EMPTY_WORLDSTATE_MISSION_SLICES,
  fissures: [],
  cycles: [],
  invasions: [],
  nightwave: null,
  sortie: {
    id: 'sortie-1',
    bossKey: 'SORTIE_BOSS_CORRUPTED_VOR',
    boss: { zh: '堕落的 Vor', en: 'Corrupted Vor' },
    expiry: new Date(Date.now() + 8 * 3_600_000).toISOString(),
    missions: [
      {
        missionTypeKey: 'MT_EXTERMINATION',
        missionType: { zh: '歼灭', en: 'Extermination' },
        modifier: { zh: '敌人物理强化（切割）', en: 'Slash Enhancement' },
        node: { zh: 'Ukko（虚空）', en: 'Ukko (Void)' },
      },
      {
        missionTypeKey: 'MT_TERRITORY',
        missionType: { zh: '拦截', en: 'Interception' },
        modifier: { zh: '卓越者大本营', en: 'Eximus Stronghold' },
        node: { zh: 'Oxomoco（虚空）', en: 'Oxomoco (Void)' },
      },
      {
        missionTypeKey: 'MT_MOBILE_DEFENSE',
        missionType: { zh: '移动防御', en: 'Mobile Defense' },
        modifier: { zh: '能量削减', en: 'Energy Reduction' },
        node: { zh: 'Teshub（虚空）', en: 'Teshub (Void)' },
      },
    ],
  },
  archon: {
    id: 'archon-1',
    bossKey: 'SORTIE_BOSS_AMAR',
    boss: { zh: '欺谋狼主', en: 'Archon Amar' },
    expiry: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    missions: [
      {
        missionTypeKey: 'MT_RESCUE',
        missionType: { zh: '救援', en: 'Rescue' },
        node: { zh: 'Tessera（金星）', en: 'Tessera (Venus)' },
      },
      {
        missionTypeKey: 'MT_TERRITORY',
        missionType: { zh: '拦截', en: 'Interception' },
        node: { zh: 'Vesper（金星）', en: 'Vesper (Venus)' },
      },
      {
        missionTypeKey: 'MT_ASSASSINATION',
        missionType: { zh: '刺杀', en: 'Assassination' },
        node: { zh: 'Huvas（金星）', en: 'Huvas (Venus)' },
      },
    ],
  },
};

describe('sortie / archon card previews', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes zh/en preview PNGs', async () => {
    mkdirSync(outDir, { recursive: true });
    const sortieZh = await renderSortieCard({ locale: 'zh', worldstate: sampleWorldstate });
    const sortieEn = await renderSortieCard({ locale: 'en', worldstate: sampleWorldstate });
    const archonZh = await renderArchonCard({ locale: 'zh', worldstate: sampleWorldstate });
    const archonEn = await renderArchonCard({ locale: 'en', worldstate: sampleWorldstate });

    writeFileSync(resolve(outDir, 'sortie-zh.png'), sortieZh);
    writeFileSync(resolve(outDir, 'sortie-en.png'), sortieEn);
    writeFileSync(resolve(outDir, 'archon-zh.png'), archonZh);
    writeFileSync(resolve(outDir, 'archon-en.png'), archonEn);

    for (const buf of [sortieZh, sortieEn, archonZh, archonEn]) {
      expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(buf.length).toBeGreaterThan(800);
    }
  }, 120_000);
});
