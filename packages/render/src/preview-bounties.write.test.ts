import { EMPTY_WORLDSTATE_MISSION_SLICES } from '@lanius/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderBountiesCard } from './render-worldstate.js';
import type { CardSkinId } from './vue-cards/skins.js';

/** 1×1 透明 PNG：预览不依赖外网 CDN。 */
const TINY_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * 赏金预览输出目录。
 * 默认写仓库 `packages/render/tmp/ws-bounties`；可设 `LANIUS_QQ_CARD_PREVIEW_DIR` 指向 agent store。
 *
 * @returns 绝对路径
 */
function resolvePreviewDir(): string {
  const fromEnv = process.env.LANIUS_QQ_CARD_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv, 'ws-bounties');
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/ws-bounties');
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
  bounties: [
    {
      tag: 'CetusSyndicate',
      name: { zh: '希图斯平原', en: 'Cetus Plains' },
      activation: new Date(Date.now() - 3_600_000).toISOString(),
      expiry: new Date(Date.now() + 5_400_000).toISOString(),
      jobs: [
        {
          jobType: '/Lotus/Types/Gameplay/Eidolon/Jobs/SabotageBountySab',
          title: { zh: '破坏赏金', en: 'Sabotage Bounty' },
          masteryReq: 0,
          minEnemyLevel: 5,
          maxEnemyLevel: 15,
          rewardTablePath:
            '/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierATableCRewards',
          rewards: [
            {
              uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCatalyst',
              name: { zh: 'Orokin 催化剂', en: 'Orokin Catalyst' },
              iconUrl: TINY_ICON,
              quantity: 1,
            },
            {
              uniqueName: '/Lotus/Types/Items/MiscItems/OrokinReactor',
              name: { zh: 'Orokin 反应堆', en: 'Orokin Reactor' },
              iconUrl: TINY_ICON,
              quantity: 1,
            },
          ],
        },
        {
          jobType: '/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountySab',
          title: { zh: '消耗赏金', en: 'Attrition Bounty' },
          masteryReq: 1,
          minEnemyLevel: 10,
          maxEnemyLevel: 30,
          rewardTablePath:
            '/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierBTableCRewards',
          rewards: [
            {
              uniqueName: '/Lotus/Types/Items/MiscItems/NanoSpores',
              name: { zh: '纳米孢子', en: 'Nano Spores' },
              iconUrl: TINY_ICON,
              quantity: 1500,
            },
          ],
        },
      ],
    },
    {
      tag: 'SolarisSyndicate',
      name: { zh: '奥布山谷', en: 'Orb Vallis' },
      expiry: new Date(Date.now() + 5_400_000).toISOString(),
      jobs: [
        {
          jobType: '/Lotus/Types/Gameplay/Venus/Jobs/VenusArtifactJobRecovery',
          title: { zh: '遗物回收', en: 'Artifact Recovery' },
          minEnemyLevel: 5,
          maxEnemyLevel: 15,
          rewardTablePath:
            '/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierATableCRewards',
          rewards: [
            {
              uniqueName: '/Lotus/Types/Items/MiscItems/Fieldron',
              name: { zh: '磁场碎裂器', en: 'Fieldron' },
              iconUrl: TINY_ICON,
            },
          ],
        },
      ],
    },
    {
      tag: 'EntratiSyndicate',
      name: { zh: '魔胎之境', en: 'Cambion Drift' },
      expiry: new Date(Date.now() + 5_400_000).toISOString(),
      jobs: [],
    },
  ],
};

describe('bounties card preview write', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes zh/en light/dark preview PNGs', async () => {
    mkdirSync(outDir, { recursive: true });
    const skins: CardSkinId[] = ['light', 'dark'];
    const locales = ['zh', 'en'] as const;

    for (const locale of locales) {
      for (const skin of skins) {
        const png = await renderBountiesCard({
          locale,
          worldstate: sampleWorldstate,
          skin,
        });
        expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        const file = resolve(outDir, `bounties-${locale}-${skin}.png`);
        writeFileSync(file, png);
      }
    }
  }, 120_000);
});
