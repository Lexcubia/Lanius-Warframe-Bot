import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { humanizeCircuitChoiceKey, mapCircuit, resolveCircuitChoiceLabel } from './map-circuit.js';
import type { UpstreamWorldstate } from './types.js';

/**
 * 本文件所在目录（fixtures 相对路径基准）。
 */
const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * 读取脱敏 EndlessXpSchedule 片段。
 *
 * @returns 含 `EndlessXpSchedule` 的上游片段
 */
function loadEndlessXpFixture(): UpstreamWorldstate {
  const raw = readFileSync(resolve(HERE, 'fixtures/endless-xp-schedule.snippet.json'), 'utf8');
  return JSON.parse(raw) as UpstreamWorldstate;
}

describe('mapCircuit', () => {
  it('maps EXC_NORMAL warframes and EXC_HARD Incarnon weapons with resolved names', () => {
    const fixture = loadEndlessXpFixture();
    // fixture Activation=1792368000000 Expiry=1792972800000 → 取中点保证命中活跃档
    const nowMs = 1_792_670_400_000;
    const dto = mapCircuit(fixture, nowMs);

    expect(dto).not.toBeNull();
    expect(dto?.normalChoices.map((row) => row.key)).toEqual(['Hydroid', 'Mirage', 'Limbo']);
    expect(dto?.hardChoices.map((row) => row.key)).toEqual([
      'Dera',
      'Cestra',
      'Okina',
      'Sybaris',
      'Sicarus',
    ]);

    const hydroid = dto?.normalChoices[0];
    expect(hydroid?.name?.en).toBe('Hydroid');
    expect(hydroid?.name?.zh.length).toBeGreaterThan(0);

    const dera = dto?.hardChoices[0];
    expect(dera?.name?.en).toMatch(/Dera/i);
    expect(dera?.name?.zh.length).toBeGreaterThan(0);

    expect(dto?.activation).toBe('2026-10-19T00:00:00.000Z');
    expect(dto?.expiry).toBe('2026-10-26T00:00:00.000Z');
  });

  it('returns null when EndlessXpSchedule is missing or empty', () => {
    expect(mapCircuit({})).toBeNull();
    expect(mapCircuit({ EndlessXpSchedule: [] })).toBeNull();
    expect(
      mapCircuit({
        EndlessXpSchedule: [{ CategoryChoices: [{ Category: 'EXC_NORMAL', Choices: [] }] }],
      }),
    ).toBeNull();
  });

  it('falls back to first entry when now is outside all windows', () => {
    const fixture = loadEndlessXpFixture();
    const dto = mapCircuit(fixture, 0);
    expect(dto?.normalChoices).toHaveLength(3);
    expect(dto?.hardChoices).toHaveLength(5);
  });
});

describe('resolveCircuitChoiceLabel / humanizeCircuitChoiceKey', () => {
  it('humanizes CamelCase Incarnon keys', () => {
    expect(humanizeCircuitChoiceKey('DualToxocyst')).toBe('Dual Toxocyst');
    expect(humanizeCircuitChoiceKey('AckAndBrunt')).toBe('Ack And Brunt');
  });

  it('resolves DualToxocyst via uniqueName table', () => {
    const name = resolveCircuitChoiceLabel('DualToxocyst');
    expect(name.en.toLowerCase()).toContain('toxocyst');
    expect(name.zh.length).toBeGreaterThan(0);
  });
});
