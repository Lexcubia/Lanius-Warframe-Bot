import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { setLabelOverrides } from './label-overrides.js';
import { mapArchonHunt, mapSortie } from './map-sorties.js';
import type { UpstreamLiteSortie, UpstreamSortie } from './types.js';

/**
 * 读取同目录 fixtures 下的 JSON 片段。
 *
 * @param name - 文件名
 * @returns 解析后的对象
 */
function loadFixture<T>(name: string): T {
  const dir = dirname(fileURLToPath(import.meta.url));
  const text = readFileSync(resolve(dir, 'fixtures', name), 'utf8');
  return JSON.parse(text) as T;
}

describe('mapSortie / mapArchonHunt', () => {
  beforeEach(() => {
    setLabelOverrides({
      factions: {},
      nodes: {},
      paths: {},
      weapons: {},
    });
  });

  it('maps Sorties fixture to boss + three mission steps with modifiers', () => {
    const fixture = loadFixture<{ Sorties: UpstreamSortie[] }>('sorties.snippet.json');
    const dto = mapSortie(fixture.Sorties);

    expect(dto).not.toBeNull();
    expect(dto?.id).toBe('fixture-4a292196');
    expect(dto?.bossKey).toBe('SORTIE_BOSS_CORRUPTED_VOR');
    expect(dto?.boss?.en).toContain('Vor');
    expect(dto?.boss?.zh).toContain('Vor');
    expect(dto?.activation).toBe('2026-10-22T16:00:00.000Z');
    expect(dto?.expiry).toBe('2026-10-23T16:00:00.000Z');
    expect(dto?.missions).toHaveLength(3);
    expect(dto?.missions[0]?.missionTypeKey).toBe('MT_EXTERMINATION');
    expect(dto?.missions[0]?.missionType?.zh).toBe('歼灭');
    expect(dto?.missions[0]?.modifierKey).toBe('SORTIE_MODIFIER_SLASH');
    expect(dto?.missions[0]?.modifier?.en.toLowerCase()).toContain('slash');
    expect(dto?.missions[0]?.nodeKey).toBe('SolNode412');
    expect(dto?.missions[0]?.node?.en).toBeTruthy();
    expect(dto?.missions[0]?.node?.en).not.toBe('SolNode412');
  });

  it('maps LiteSorties fixture to archon hunt without modifiers', () => {
    const fixture = loadFixture<{ LiteSorties: UpstreamLiteSortie[] }>('lite-sorties.snippet.json');
    const dto = mapArchonHunt(fixture.LiteSorties);

    expect(dto).not.toBeNull();
    expect(dto?.id).toBe('fixture-1427d302');
    expect(dto?.bossKey).toBe('SORTIE_BOSS_AMAR');
    expect(dto?.boss?.en).toContain('Amar');
    expect(dto?.boss?.zh).toContain('狼主');
    expect(dto?.missions).toHaveLength(3);
    expect(dto?.missions[0]?.missionTypeKey).toBe('MT_RESCUE');
    expect(dto?.missions[0]?.missionType?.zh).toBe('救援');
    expect(dto?.missions[0]?.modifierKey).toBeUndefined();
    expect(dto?.missions[2]?.missionTypeKey).toBe('MT_ASSASSINATION');
    expect(dto?.missions.every((m) => m.modifier === undefined)).toBe(true);
  });

  it('returns null for missing or id-less upstream rows', () => {
    expect(mapSortie(undefined)).toBeNull();
    expect(mapSortie([])).toBeNull();
    expect(mapSortie([{ Boss: 'SORTIE_BOSS_AMAR' }])).toBeNull();
    expect(mapArchonHunt(undefined)).toBeNull();
    expect(mapArchonHunt([{ Boss: 'SORTIE_BOSS_AMAR' }])).toBeNull();
  });
});
