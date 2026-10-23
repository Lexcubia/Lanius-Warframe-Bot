import { EMPTY_WORLDSTATE_MISSION_SLICES } from '@lanius/core';
import { describe, expect, it } from 'vitest';

import { formatBountiesText } from './worldstate-text.js';

const base = {
  realm: 'international' as const,
  fetchedAt: '2026-10-10T12:00:00.000Z',
  ...EMPTY_WORLDSTATE_MISSION_SLICES,
  cycles: [],
  fissures: [],
  invasions: [],
  nightwave: null,
};

describe('formatBountiesText', () => {
  it('renders jobs with resolved reward names', () => {
    const text = formatBountiesText(
      {
        ...base,
        bounties: [
          {
            tag: 'CetusSyndicate',
            name: { zh: '希图斯平原', en: 'Cetus Plains' },
            expiry: new Date(Date.now() + 3_600_000).toISOString(),
            jobs: [
              {
                title: { zh: '破坏赏金', en: 'Sabotage' },
                minEnemyLevel: 5,
                maxEnemyLevel: 15,
                rewards: [
                  {
                    name: { zh: '催化剂', en: 'Catalyst' },
                    uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCatalyst',
                  },
                ],
              },
            ],
          },
        ],
      },
      'zh',
    );
    expect(text).toContain('赏金');
    expect(text).toContain('希图斯平原');
    expect(text).toContain('破坏赏金');
    expect(text).toContain('催化剂');
    expect(text).not.toContain('MissionDecks');
  });

  it('shows honest empty state when Jobs is empty', () => {
    const text = formatBountiesText(
      {
        ...base,
        bounties: [
          {
            tag: 'EntratiSyndicate',
            name: { zh: '魔胎之境', en: 'Cambion Drift' },
            expiry: new Date(Date.now() + 3_600_000).toISOString(),
            jobs: [],
          },
        ],
      },
      'zh',
    );
    expect(text).toContain('本轮无赏金表');
  });

  it('includes map filter summary when provided', () => {
    const text = formatBountiesText({ ...base, bounties: [] }, 'zh', { filterSummary: '平原' });
    expect(text).toContain('地图：平原');
    expect(text).toContain('暂无赏金数据');
  });
});
