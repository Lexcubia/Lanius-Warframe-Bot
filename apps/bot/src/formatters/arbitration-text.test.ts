import { EMPTY_WORLDSTATE_MISSION_SLICES } from '@lanius/core';
import { describe, expect, it } from 'vitest';

import { formatArbitrationText } from './worldstate-text.js';

const base = {
  realm: 'international' as const,
  fetchedAt: '2026-10-23T09:30:00.000Z',
  cycles: [],
  fissures: [],
  invasions: [],
  nightwave: null,
  ...EMPTY_WORLDSTATE_MISSION_SLICES,
};

describe('formatArbitrationText', () => {
  it('shows empty-state copy when arbitration is null', () => {
    const text = formatArbitrationText(base, 'zh');
    expect(text).toContain('仲裁');
    expect(text).toContain('暂无仲裁数据');
  });

  it('formats node · mission · enemy when present', () => {
    const text = formatArbitrationText(
      {
        ...base,
        arbitration: {
          nodeKey: 'SolNode64',
          node: { zh: 'Tessera（金星）', en: 'Tessera (Venus)' },
          missionTypeKey: 'Defense',
          missionType: { zh: '防御', en: 'Defense' },
          enemyKey: 'Corpus',
          enemy: { zh: 'Corpus', en: 'Corpus' },
          expiry: new Date(Date.now() + 3_600_000).toISOString(),
          source: 'warframestat',
        },
      },
      'zh',
    );
    expect(text).toContain('Tessera');
    expect(text).toContain('防御');
    expect(text).toContain('Corpus');
  });
});
