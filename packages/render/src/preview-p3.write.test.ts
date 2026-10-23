import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderFissuresCard } from './render-worldstate.js';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../tmp');
mkdirSync(outDir, { recursive: true });

describe('fix p3', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('renders', async () => {
    // fetchedAt 用整点 UTC 便于肉眼验证 +8
    const img = await renderFissuresCard({
      locale: 'zh',
      worldstate: {
        realm: 'international',
        fetchedAt: '2026-10-13T18:00:00.000Z', // 应显示 2026-10-14 02:00:00
        cycles: [],
        invasions: [],
        nightwave: null,
        fissures: [
          {
            id: 'f1',
            era: 'lith',
            eraLabel: { zh: '古纪', en: 'Lith' },
            missionTypeKey: 'MT_INTEL',
            missionType: { zh: '间谍', en: 'Spy' },
            node: { zh: 'Cambria（地球）', en: 'Cambria' },
            path: 'empyrean',
            pathLabel: { zh: '九重天', en: 'Empyrean' },
            iconPath: '/Lotus/Interface/Icons/Relics/RelicLithA.png',
            iconUrl:
              'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Relics/RelicLithA.png',
            expiry: new Date(Date.now() + 3_661_000).toISOString(),
            remainingMs: 3_661_000,
          },
          {
            id: 'f2',
            era: 'requiem',
            eraLabel: { zh: '安魂', en: 'Requiem' },
            missionTypeKey: 'MT_SURVIVAL',
            missionType: { zh: '生存', en: 'Survival' },
            node: { zh: 'Mot（虚空）', en: 'Mot' },
            path: 'steelPath',
            pathLabel: { zh: '钢铁之路', en: 'Steel Path' },
            iconPath: '/Lotus/Interface/Icons/Relics/RelicRequiemA.png',
            iconUrl:
              'https://content.warframe.com/PublicExport/Lotus/Interface/Icons/Relics/RelicRequiemA.png',
            expiry: new Date(Date.now() + 5_400_000).toISOString(),
            remainingMs: 5_400_000,
          },
        ],
      },
    });
    writeFileSync(resolve(outDir, 'p3-fiss.png'), img);
    console.log('OK');
  }, 60000);
});
