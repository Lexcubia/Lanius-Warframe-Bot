import { beforeEach, describe, expect, it } from 'vitest';

import { setLabelOverrides } from './label-overrides.js';
import { mapWorldstate } from './map-worldstate.js';
import type { UpstreamWorldstate } from './types.js';

describe('mapWorldstate', () => {
  beforeEach(() => {
    setLabelOverrides({
      factions: {
        FC_GRINEER: { zh: 'Grineer', en: 'Grineer' },
        FC_CORPUS: { zh: 'Corpus', en: 'Corpus' },
      },
      nodes: {},
      paths: {},
      weapons: {},
    });
  });

  it('maps invasions, fissures and nightwave to readable labels', () => {
    const now = Date.parse('2026-10-10T12:00:00.000Z');
    const raw: UpstreamWorldstate = {
      ActiveMissions: [
        {
          _id: { $oid: 'fis-1' },
          Node: 'SolNode66',
          MissionType: 'MT_INTEL',
          Modifier: 'VoidT1',
          Hard: true,
          Expiry: { $date: { $numberLong: String(now + 3_600_000) } },
        },
        {
          _id: { $oid: 'fis-expired' },
          Node: 'SolNode1',
          MissionType: 'MT_SURVIVAL',
          Modifier: 'VoidT2',
          Expiry: { $date: { $numberLong: String(now - 1_000) } },
        },
      ],
      VoidStorms: [
        {
          _id: { $oid: 'storm-1' },
          Node: 'CrewBattleNode522',
          ActiveMissionTier: 'VoidT1',
          Expiry: { $date: { $numberLong: String(now + 1_800_000) } },
        },
      ],
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
                ItemCount: 3,
              },
            ],
          },
          DefenderReward: {
            countedItems: [
              {
                ItemType: '/Lotus/Types/Items/MiscItems/OrokinCatalyst',
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
            _id: { $oid: 'ch-2' },
            Challenge:
              '/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyCompleteMissions',
          },
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
    expect(dto.fissures).toHaveLength(2);
    expect(dto.fissures[0]?.path).toBe('steelPath');
    expect(dto.fissures[0]?.era).toBe('lith');
    expect(dto.fissures[0]?.eraLabel.zh).toBe('古纪');
    expect(dto.fissures[0]?.missionType.zh).toBe('间谍');
    expect(dto.fissures[0]?.iconPath).toContain('RelicLithA.png');
    expect(dto.fissures[0]?.iconUrl).toContain('content.warframe.com/PublicExport');
    expect(dto.fissures.find((row) => row.path === 'empyrean')?.missionType.zh).toBe(
      '前哨战',
    );
    expect(dto.invasions).toHaveLength(1);
    expect(dto.invasions[0]?.node.en).toContain('Naga');
    expect(dto.invasions[0]?.attackingFaction).toEqual({
      zh: 'Grineer',
      en: 'Grineer',
    });
    expect(dto.invasions[0]?.defendingFaction.en).toBe('Corpus');
    expect(dto.invasions[0]?.attackerReward?.name.en.toLowerCase()).toContain(
      'dera',
    );
    expect(dto.invasions[0]?.attackerReward?.uniqueName).toContain(
      'DeraVandalStock',
    );
    expect(dto.invasions[0]?.attackerReward?.quantity).toBe(3);
    expect(dto.invasions[0]?.defenderReward?.quantity).toBe(1);
    expect(dto.invasions[0]?.completionPct).toBe(50);
    expect(dto.nightwave?.activeChallenges.map((c) => c.kind)).toEqual([
      'daily',
      'weekly',
    ]);
    expect(dto.nightwave?.activeChallenges[0]?.kindLabel.zh).toBe('每日');
    expect(dto.nightwave?.activeChallenges[1]?.kindLabel.zh).toBe('每周');
    expect(dto.nightwave?.activeChallenges[0]?.title?.en).toBeTruthy();
    expect(dto.nightwave?.activeChallenges[0]?.title?.en).not.toContain('/Lotus/');
    expect(JSON.stringify(dto)).not.toContain('AttackerMissionInfo');
    expect(JSON.stringify(dto)).not.toContain('SeasonInfo');
    expect(JSON.stringify(dto)).not.toContain('FC_GRINEER');
    expect(JSON.stringify(dto)).not.toContain('SolNode189');
    expect(JSON.stringify(dto)).not.toContain('ActiveMissions');
  });

  it('returns empty invasions and null nightwave for sparse upstream', () => {
    const dto = mapWorldstate('international', {}, '2026-10-10T12:00:00.000Z');
    expect(dto.invasions).toEqual([]);
    expect(dto.fissures).toEqual([]);
    expect(dto.nightwave).toBeNull();
    expect(dto.cycles).toHaveLength(6);
    expect(dto.cycles.map((row) => row.id)).toEqual([
      'earth',
      'cetus',
      'cambion',
      'vallis',
      'duviri',
      'zariman',
    ]);
  });
});

