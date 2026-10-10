import { describe, expect, it } from 'vitest';

import { mapWorldstate } from './map-worldstate.js';
import type { UpstreamWorldstate } from './types.js';

describe('mapWorldstate', () => {
  it('maps invasions and nightwave without leaking upstream keys', () => {
    const raw: UpstreamWorldstate = {
      Invasions: [
        {
          _id: { $oid: 'inv-1' },
          Node: 'SolNode1',
          AttackerMissionInfo: { faction: 'FC_GRINEER' },
          DefenderMissionInfo: { faction: 'FC_CORPUS' },
          AttackerReward: {
            countedItems: [{ ItemType: '/Lotus/Types/Items/A', ItemCount: 1 }],
          },
          Count: 50,
          Goal: 100,
          Completed: false,
        },
      ],
      SeasonInfo: {
        Season: 3,
        Phase: 1,
        ActiveChallenges: [
          {
            _id: { $oid: 'ch-1' },
            Challenge: '/Lotus/Types/Challenges/Seasons/Daily/SeasonDailyKill',
          },
        ],
      },
    };

    const dto = mapWorldstate('international', raw, '2026-10-10T12:00:00.000Z');

    expect(dto.realm).toBe('international');
    expect(dto.invasions).toHaveLength(1);
    expect(dto.invasions[0]).toMatchObject({
      id: 'inv-1',
      node: 'SolNode1',
      attackingFaction: 'FC_GRINEER',
      defendingFaction: 'FC_CORPUS',
      completionPct: 50,
      expired: false,
    });
    expect(dto.nightwave?.season).toBe(3);
    expect(dto.nightwave?.activeChallenges[0]?.id).toBe('ch-1');
    expect(JSON.stringify(dto)).not.toContain('AttackerMissionInfo');
    expect(JSON.stringify(dto)).not.toContain('SeasonInfo');
  });

  it('returns empty invasions and null nightwave for sparse upstream', () => {
    const dto = mapWorldstate('international', {}, '2026-10-10T12:00:00.000Z');
    expect(dto.invasions).toEqual([]);
    expect(dto.nightwave).toBeNull();
  });
});
