import { beforeEach, describe, expect, it } from 'vitest';

import { setLabelOverrides } from './label-overrides.js';
import { mapWorldstate } from './map-worldstate.js';
import type { UpstreamWorldstate } from './types.js';

describe('mapWorldstate', () => {
  beforeEach(() => {
    setLabelOverrides({
      factions: {
        FC_GRINEER: { zh: '格林尼尔', en: 'Grineer' },
        FC_CORPUS: { zh: 'Corpus', en: 'Corpus' },
      },
      nodes: {},
      paths: {},
    });
  });

  it('maps invasions and nightwave to readable labels', () => {
    const raw: UpstreamWorldstate = {
      Invasions: [
        {
          _id: { $oid: 'inv-1' },
          Node: 'SolNode189',
          AttackerMissionInfo: { faction: 'FC_GRINEER' },
          DefenderMissionInfo: { faction: 'FC_CORPUS' },
          AttackerReward: {
            countedItems: [
              {
                ItemType: '/Lotus/Types/Recipes/Weapons/WeaponParts/DeraVandalStock',
                ItemCount: 1,
              },
            ],
          },
          Count: 50,
          Goal: 100,
          Completed: false,
        },
        {
          _id: { $oid: 'inv-done' },
          Node: 'SolNode1',
          AttackerMissionInfo: { faction: 'FC_GRINEER' },
          DefenderMissionInfo: { faction: 'FC_CORPUS' },
          Completed: true,
        },
      ],
      SeasonInfo: {
        Season: 3,
        Phase: 1,
        ActiveChallenges: [
          {
            _id: { $oid: 'ch-1' },
            Challenge:
              '/Lotus/Types/Challenges/Seasons/Daily/SeasonDailyKillEnemiesWithPrimary',
          },
        ],
      },
    };

    const dto = mapWorldstate('international', raw, '2026-10-10T12:00:00.000Z');

    expect(dto.realm).toBe('international');
    expect(dto.invasions).toHaveLength(1);
    expect(dto.invasions[0]?.node.en).toContain('Naga');
    expect(dto.invasions[0]?.attackingFaction).toEqual({
      zh: '格林尼尔',
      en: 'Grineer',
    });
    expect(dto.invasions[0]?.defendingFaction.en).toBe('Corpus');
    expect(dto.invasions[0]?.attackerReward?.en.toLowerCase()).toContain('dera');
    expect(dto.invasions[0]?.completionPct).toBe(50);
    expect(dto.nightwave?.activeChallenges[0]?.title?.en).toBeTruthy();
    expect(dto.nightwave?.activeChallenges[0]?.title?.en).not.toContain('/Lotus/');
    expect(JSON.stringify(dto)).not.toContain('AttackerMissionInfo');
    expect(JSON.stringify(dto)).not.toContain('SeasonInfo');
    expect(JSON.stringify(dto)).not.toContain('FC_GRINEER');
    expect(JSON.stringify(dto)).not.toContain('SolNode189');
  });

  it('returns empty invasions and null nightwave for sparse upstream', () => {
    const dto = mapWorldstate('international', {}, '2026-10-10T12:00:00.000Z');
    expect(dto.invasions).toEqual([]);
    expect(dto.nightwave).toBeNull();
  });
});
