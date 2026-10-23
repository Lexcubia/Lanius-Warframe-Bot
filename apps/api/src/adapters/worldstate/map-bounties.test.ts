import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { mapBounties } from './map-bounties.js';
import { buildMissionDeckCatalog, type MissionDeckRewardTable } from './resolve-mission-deck.js';
import type { UpstreamWorldstate } from './types.js';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * 读取 fixtures JSON。
 *
 * @param name - 文件名
 * @returns 解析对象
 */
function loadFixture<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(fixturesDir, name), 'utf8')) as T;
}

describe('mapBounties', () => {
  it('maps priority syndicates with resolved rewards and empty-job honesty', () => {
    const snippet = loadFixture<UpstreamWorldstate>('syndicate-jobs.snippet.json');
    const rewardsRaw = loadFixture<Record<string, MissionDeckRewardTable>>(
      'export-rewards.mini.json',
    );
    // 扩展 mini 表，覆盖 Cetus / Solaris 路径以便断言解析
    const catalog = buildMissionDeckCatalog({
      ...rewardsRaw,
      '/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierATableCRewards': [
        [
          {
            type: '/Lotus/StoreItems/Types/Items/MiscItems/OrokinCatalyst',
            itemCount: 1,
            probability: 1,
          },
        ],
      ],
      '/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierATableCRewards': [
        [
          {
            type: '/Lotus/StoreItems/Types/Items/MiscItems/OrokinReactor',
            itemCount: 1,
            probability: 1,
          },
        ],
      ],
    });

    const bounties = mapBounties(snippet, catalog);

    expect(bounties.map((row) => row.tag)).toEqual([
      'CetusSyndicate',
      'SolarisSyndicate',
      'EntratiSyndicate',
    ]);
    expect(bounties[0]?.name?.zh).toContain('平原');
    expect(bounties[0]?.jobs.length).toBe(2);
    expect(bounties[0]?.jobs[0]?.rewardTablePath).toContain('TierATableCRewards');
    expect(bounties[0]?.jobs[0]?.rewards[0]?.uniqueName).toContain('OrokinCatalyst');
    expect(bounties[0]?.jobs[0]?.rewards[0]?.name.en).toBeTruthy();
    expect(bounties[2]?.jobs[0]?.rewards.some((item) => item.uniqueName?.includes('Orokin'))).toBe(
      true,
    );
  });

  it('keeps empty Jobs syndicate with honest empty rewards array', () => {
    const raw: UpstreamWorldstate = {
      SyndicateMissions: [
        {
          Tag: 'CetusSyndicate',
          Activation: { $date: { $numberLong: '1792730542455' } },
          Expiry: { $date: { $numberLong: '1792739541329' } },
          Jobs: [],
        },
        {
          Tag: 'ZarimanSyndicate',
          Jobs: [],
        },
      ],
    };

    const bounties = mapBounties(raw);
    expect(bounties).toHaveLength(1);
    expect(bounties[0]?.tag).toBe('CetusSyndicate');
    expect(bounties[0]?.jobs).toEqual([]);
    expect(bounties[0]?.expiry).toBeTruthy();
  });

  it('includes non-priority syndicate only when Jobs present', () => {
    const raw: UpstreamWorldstate = {
      SyndicateMissions: [
        {
          Tag: 'ZarimanSyndicate',
          Jobs: [
            {
              jobType: '/Lotus/Types/Gameplay/Zariman/Jobs/Dummy',
              rewards: '/Lotus/Types/Game/MissionDecks/Missing',
            },
          ],
        },
      ],
    };
    const bounties = mapBounties(raw);
    expect(bounties).toHaveLength(1);
    expect(bounties[0]?.tag).toBe('ZarimanSyndicate');
    expect(bounties[0]?.jobs[0]?.rewards).toEqual([]);
  });
});
