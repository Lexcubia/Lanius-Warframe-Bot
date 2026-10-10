import { describe, expect, it } from 'vitest';

import { renderWorldstateCard } from './render-worldstate.js';

describe('renderWorldstateCard', () => {
  it('returns a non-empty PNG buffer', async () => {
    const png = await renderWorldstateCard({
      locale: 'zh',
      worldstate: {
        realm: 'international',
        fetchedAt: '2026-10-10T12:00:00.000Z',
        invasions: [
          {
            id: '1',
            node: { zh: 'Galatea（海王星）', en: 'Galatea (Neptune)' },
            attackingFaction: { zh: '格林尼尔', en: 'Grineer' },
            defendingFaction: { zh: 'Corpus', en: 'Corpus' },
            completionPct: 42,
            expired: false,
          },
        ],
        nightwave: {
          season: 3,
          phase: 1,
          activeChallenges: [{ id: 'c1', title: { zh: '每日击杀', en: 'Daily Kill' } }],
        },
      },
    });

    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.length).toBeGreaterThan(1000);
  });
});
