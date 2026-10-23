/**
 * 将警报卡预览 PNG 写入 Project store `media/ws-alerts/`（及本包 tmp）。
 * 需 `LANIUS_BROWSER_TESTS=1`；默认 vitest 会排除本文件。
 */
import { EMPTY_WORLDSTATE_MISSION_SLICES, type WorldstateDto } from '@lanius/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderAlertsCard } from './render-worldstate.js';

const pkgTmp = resolve(dirname(fileURLToPath(import.meta.url)), '../tmp');
const storeMedia = resolve(
  '/cursor/stores/bc-4d7c66be-70a8-44c1-8457-760a78beb7ee/media/ws-alerts',
);

/** 1×1 透明 PNG data URL */
const TINY_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * 构造预览用 worldstate。
 *
 * @param alerts - 警报切片
 * @returns WorldstateDto
 */
function sample(alerts: WorldstateDto['alerts']): WorldstateDto {
  return {
    realm: 'international',
    fetchedAt: '2026-10-10T12:00:00.000Z',
    cycles: [],
    fissures: [],
    invasions: [],
    nightwave: null,
    ...EMPTY_WORLDSTATE_MISSION_SLICES,
    alerts,
  };
}

const alertRow = {
  id: 'fixture-d8229290',
  tag: 'RoadToTauEvent',
  node: { zh: 'Galatea（海王星）', en: 'Galatea (Neptune)' },
  missionType: { zh: '移动防御', en: 'Mobile Defense' },
  faction: { zh: 'Infested', en: 'Infested' },
  credits: 17000,
  expiry: '2099-01-01T12:00:00.000Z',
  rewards: [
    {
      uniqueName: '/Lotus/Types/Gameplay/Events/RoadToTauEvent/RoadToTauEventResource',
      name: { zh: '通往 Tau 资源', en: 'Road to Tau Resource' },
      iconUrl: TINY_ICON,
      quantity: 50,
    },
  ],
} satisfies WorldstateDto['alerts'][number];

describe('preview alerts write', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes alerts light/dark + empty PNGs to store media', async () => {
    mkdirSync(pkgTmp, { recursive: true });
    mkdirSync(storeMedia, { recursive: true });

    const withData = sample([alertRow]);
    const emptyWs = sample([]);

    for (const skin of ['light', 'dark'] as const) {
      const png = await renderAlertsCard({
        locale: 'zh',
        worldstate: withData,
        skin,
      });
      const name = `alerts-${skin}.png`;
      writeFileSync(resolve(pkgTmp, name), png);
      writeFileSync(resolve(storeMedia, name), png);
      expect(png.length).toBeGreaterThan(1000);
    }

    const emptyLight = await renderAlertsCard({
      locale: 'zh',
      worldstate: emptyWs,
      skin: 'light',
    });
    writeFileSync(resolve(pkgTmp, 'alerts-empty.png'), emptyLight);
    writeFileSync(resolve(storeMedia, 'alerts-empty.png'), emptyLight);
    expect(emptyLight.length).toBeGreaterThan(500);
  }, 90_000);
});
