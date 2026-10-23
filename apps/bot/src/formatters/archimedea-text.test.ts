import { EMPTY_WORLDSTATE_MISSION_SLICES, type WorldstateDto } from '@lanius/core';
import { describe, expect, it } from 'vitest';

import { formatArchimedeaText } from './archimedea-text.js';

/**
 * 最小科研 worldstate 夹具。
 */
const sample: WorldstateDto = {
  realm: 'international',
  fetchedAt: '2026-10-23T12:00:00.000Z',
  ...EMPTY_WORLDSTATE_MISSION_SLICES,
  cycles: [],
  fissures: [],
  invasions: [],
  nightwave: null,
  archimedea: {
    seasons: [
      {
        kind: 'lab',
        expiry: '2026-10-27T00:00:00.000Z',
        missions: [
          {
            missionTypeKey: 'MT_EXTERMINATION',
            missionType: { zh: '歼灭', en: 'Extermination' },
            factionKey: 'FC_MITW',
            faction: { zh: '墙中人', en: 'Man in the Wall' },
            difficulties: [
              {
                typeKey: 'CD_HARD',
                deviationKey: 'FortifiedFoes',
                deviation: { zh: '坚不可摧', en: 'Fortified Foes' },
                riskKeys: ['AcceleratedEnemies', 'EMPBlackHole'],
                risks: [
                  { zh: '加速敌军', en: 'Accelerated Enemies' },
                  { zh: 'EMP 黑洞', en: 'EMP Black Hole' },
                ],
              },
            ],
          },
        ],
        variableKeys: ['NoPets', 'DullBlades'],
        variables: [
          { zh: '禁用同伴', en: 'No Pets Allowed' },
          { zh: '钝重兵刃', en: 'Dull Blades' },
        ],
      },
      {
        kind: 'hex',
        missions: [],
        variableKeys: [],
      },
    ],
  },
};

describe('formatArchimedeaText', () => {
  it('summarizes both seasons for /科研', () => {
    const text = formatArchimedeaText(sample, 'zh');
    expect(text).toContain('科研');
    expect(text).toContain('精英科研');
    expect(text).toContain('时光科研');
    expect(text).toContain('歼灭');
    expect(text).toContain('坚不可摧');
    expect(text).toContain('禁用同伴');
  });

  it('filters to lab for /精英科研', () => {
    const text = formatArchimedeaText(sample, 'zh', { kind: 'lab' });
    expect(text).toContain('精英科研');
    expect(text).not.toContain('时光科研');
  });

  it('shows empty state when no data', () => {
    const empty: WorldstateDto = {
      ...sample,
      archimedea: null,
    };
    const text = formatArchimedeaText(empty, 'zh');
    expect(text).toContain('当前无科研数据');
  });
});
