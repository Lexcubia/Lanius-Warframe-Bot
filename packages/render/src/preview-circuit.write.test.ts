import { EMPTY_WORLDSTATE_MISSION_SLICES } from '@lanius/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderCircuitCard } from './render-worldstate.js';
import type { CardSkinId } from './vue-cards/skins.js';

/**
 * 回廊预览输出目录。
 * 默认写 `packages/render/tmp/ws-circuit`；可用 `LANIUS_CIRCUIT_PREVIEW_DIR` 指向 agent store。
 *
 * @returns 绝对路径
 */
function resolveCircuitPreviewDir(): string {
  const fromEnv = process.env.LANIUS_CIRCUIT_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/ws-circuit');
}

const outDir = resolveCircuitPreviewDir();

/**
 * 回廊预览夹具（对齐 EndlessXpSchedule fixture 本周选项）。
 */
const sampleWorldstate = {
  realm: 'international' as const,
  fetchedAt: new Date().toISOString(),
  ...EMPTY_WORLDSTATE_MISSION_SLICES,
  cycles: [],
  fissures: [],
  invasions: [],
  nightwave: null,
  circuit: {
    activation: '2026-10-19T00:00:00.000Z',
    expiry: new Date(Date.now() + 4 * 24 * 3600_000).toISOString(),
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

describe('circuit preview write', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes circuit light/dark/empty PNGs', async () => {
    mkdirSync(outDir, { recursive: true });
    for (const skin of ['light', 'dark'] as CardSkinId[]) {
      const png = await renderCircuitCard({
        locale: 'zh',
        worldstate: sampleWorldstate,
        skin,
      });
      writeFileSync(resolve(outDir, `circuit-${skin}.png`), png);
      expect(png.length).toBeGreaterThan(1000);
    }
    const empty = await renderCircuitCard({
      locale: 'zh',
      worldstate: { ...sampleWorldstate, circuit: null },
      skin: 'light',
    });
    writeFileSync(resolve(outDir, 'circuit-empty-light.png'), empty);
    expect(empty.length).toBeGreaterThan(1000);
  }, 120_000);
});
