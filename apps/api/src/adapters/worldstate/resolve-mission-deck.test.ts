import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildMissionDeckCatalog,
  resolveMissionDeckRewards,
  type MissionDeckRewardTable,
} from './resolve-mission-deck.js';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * 读取 fixtures 目录下的 JSON 文件。
 *
 * @param name - 文件名
 * @returns 解析后的对象
 */
function loadFixture<T>(name: string): T {
  const text = readFileSync(resolve(fixturesDir, name), 'utf8');
  return JSON.parse(text) as T;
}

describe('resolveMissionDeckRewards', () => {
  it('dedupes drops across rotations and strips StoreItems prefix', () => {
    const raw = loadFixture<Record<string, MissionDeckRewardTable>>('export-rewards.mini.json');
    const catalog = buildMissionDeckCatalog(raw);
    const path = '/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierATableCRewards';

    const items = resolveMissionDeckRewards(path, catalog, {
      resolveItemName: (uniqueName) => {
        if (uniqueName.endsWith('OrokinCatalyst')) {
          return { zh: '武形合金', en: 'Orokin Catalyst' };
        }
        if (uniqueName.endsWith('OrokinReactor')) {
          return { zh: '奥金反应堆', en: 'Orokin Reactor' };
        }
        return undefined;
      },
    });

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCatalyst',
      name: { zh: '武形合金', en: 'Orokin Catalyst' },
      quantity: 1,
    });
    expect(items[1]?.uniqueName).toBe('/Lotus/Types/Items/MiscItems/OrokinReactor');
    expect(items[2]?.uniqueName).toContain('InfMapricoFruitItem');
    expect(items[2]?.quantity).toBe(15);
    expect(items[2]?.name.en).toBe('InfMapricoFruitItem');
  });

  it('returns empty array for missing or blank table paths', () => {
    const catalog = buildMissionDeckCatalog({});
    expect(resolveMissionDeckRewards('', catalog)).toEqual([]);
    expect(
      resolveMissionDeckRewards('/Lotus/Types/Game/MissionDecks/Missing/Table', catalog),
    ).toEqual([]);
  });

  it('loads sanitized syndicate Jobs fixture with MissionDeck paths', () => {
    const snippet = loadFixture<{
      SyndicateMissions: Array<{ Tag?: string; Jobs?: Array<{ rewards?: string }> }>;
    }>('syndicate-jobs.snippet.json');

    expect(snippet.SyndicateMissions.length).toBeGreaterThan(0);
    const firstJob = snippet.SyndicateMissions[0]?.Jobs?.[0];
    expect(firstJob?.rewards).toMatch(/MissionDecks/);
  });

  it('loads sanitized Conquests / Alerts / Sorties fixtures', () => {
    const conquests = loadFixture<{ Conquests: Array<{ Type?: string }> }>(
      'conquests.snippet.json',
    );
    const types = new Set(conquests.Conquests.map((row) => row.Type));
    expect(types.has('CT_LAB') || types.has('CT_HEX')).toBe(true);

    const alerts = loadFixture<{ Alerts: Array<{ MissionInfo?: unknown }> }>('alerts.snippet.json');
    expect(alerts.Alerts[0]?.MissionInfo).toBeTruthy();

    const sorties = loadFixture<{ Sorties: Array<{ Variants?: unknown[] }> }>(
      'sorties.snippet.json',
    );
    expect(sorties.Sorties[0]?.Variants?.length).toBe(3);
  });
});
