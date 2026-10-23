import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { setLabelOverrides } from './label-overrides.js';
import { mapAlerts } from './map-alerts.js';
import type { UpstreamWorldstate } from './types.js';

const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');

describe('mapAlerts', () => {
  beforeEach(() => {
    setLabelOverrides({
      factions: {
        FC_INFESTATION: { zh: 'Infested', en: 'Infested' },
      },
      nodes: {},
      paths: {},
      weapons: {},
    });
  });

  it('maps fixture Alerts to AlertDto with labels and rewards', () => {
    const snippet = JSON.parse(
      readFileSync(resolve(fixtureDir, 'alerts.snippet.json'), 'utf8'),
    ) as UpstreamWorldstate;
    // fixture Expiry 远在未来；用早于 Activation 的 now 仍保留条目
    const nowMs = 1_700_000_000_000;
    const alerts = mapAlerts(snippet, nowMs);

    expect(alerts).toHaveLength(1);
    const row = alerts[0]!;
    expect(row.id).toBe('fixture-d8229290');
    expect(row.tag).toBe('RoadToTauEvent');
    expect(row.nodeKey).toBe('SolNode175');
    expect(row.node?.en).toBeTruthy();
    expect(row.missionTypeKey).toBe('MT_MOBILE_DEFENSE');
    expect(row.missionType?.zh).toBe('移动防御');
    expect(row.factionKey).toBe('FC_INFESTATION');
    expect(row.faction).toEqual({ zh: 'Infested', en: 'Infested' });
    expect(row.credits).toBe(17000);
    expect(row.rewards).toHaveLength(1);
    expect(row.rewards[0]?.uniqueName).toContain('RoadToTauEventResource');
    expect(row.rewards[0]?.quantity).toBe(50);
    expect(row.activation).toMatch(/^\d{4}-/);
    expect(row.expiry).toMatch(/^\d{4}-/);
    // 上游嵌套字段不得泄漏；nodeKey 为契约字段可保留。
    expect(JSON.stringify(alerts)).not.toContain('MissionInfo');
    expect(JSON.stringify(alerts)).not.toContain('missionReward');
  });

  it('returns empty array when Alerts missing or all expired', () => {
    expect(mapAlerts({}, Date.now())).toEqual([]);

    const expired: UpstreamWorldstate = {
      Alerts: [
        {
          _id: { $oid: 'old' },
          Expiry: { $date: { $numberLong: '1000' } },
          MissionInfo: { missionType: 'MT_EXTERMINATION', location: 'SolNode1' },
        },
      ],
    };
    expect(mapAlerts(expired, 2_000)).toEqual([]);
  });

  it('skips rows without id', () => {
    const raw: UpstreamWorldstate = {
      Alerts: [
        {
          MissionInfo: { missionType: 'MT_DEFENSE', location: 'SolNode1' },
        },
      ],
    };
    expect(mapAlerts(raw, Date.now())).toEqual([]);
  });
});
