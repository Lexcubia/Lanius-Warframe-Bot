import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { mapArbitration } from './map-arbitration.js';
import {
  normalizeWarframestatArbitration,
  WARFRAMESTAT_ARBITRATION_SOURCE,
} from './warframestat-arbitration.js';
import type { UpstreamArbitration } from './types.js';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * 加载仲裁社区源 fixture。
 *
 * @param name - fixtures 目录下文件名
 * @returns 解析后的 JSON 对象
 */
function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8')) as Record<string, unknown>;
}

describe('mapArbitration', () => {
  it('maps warframestat fixture into ArbitrationDto', () => {
    const raw = normalizeWarframestatArbitration(
      loadFixture('warframestat-arbitration.snippet.json'),
    );
    const dto = mapArbitration(raw, Date.parse('2026-10-23T09:30:00.000Z'));
    expect(dto).not.toBeNull();
    expect(dto?.source).toBe(WARFRAMESTAT_ARBITRATION_SOURCE);
    expect(dto?.nodeKey).toBe('SolNode64');
    expect(dto?.missionTypeKey).toBe('Defense');
    expect(dto?.missionType?.en).toMatch(/Defense/i);
    expect(dto?.enemyKey).toBe('Corpus');
    expect(dto?.activation).toBe('2026-10-23T09:00:00.000Z');
    expect(dto?.expiry).toBe('2026-10-23T10:00:00.000Z');
  });

  it('returns null when expired flag is true', () => {
    const raw: UpstreamArbitration = {
      nodeKey: 'SolNode1',
      type: 'Survival',
      expired: true,
      expiry: '2026-10-23T12:00:00.000Z',
    };
    expect(mapArbitration(raw, Date.parse('2026-10-23T09:00:00.000Z'))).toBeNull();
  });

  it('returns null when expiry is in the past', () => {
    const raw: UpstreamArbitration = {
      nodeKey: 'SolNode1',
      type: 'Survival',
      expiry: '2026-10-23T08:00:00.000Z',
    };
    expect(mapArbitration(raw, Date.parse('2026-10-23T09:00:00.000Z'))).toBeNull();
  });

  it('returns null when missing node and mission type', () => {
    const raw: UpstreamArbitration = {
      enemy: 'Corpus',
      expiry: '2026-10-23T12:00:00.000Z',
    };
    expect(mapArbitration(raw, Date.parse('2026-10-23T09:00:00.000Z'))).toBeNull();
  });
});

describe('normalizeWarframestatArbitration', () => {
  it('tolerates sparse objects', () => {
    expect(normalizeWarframestatArbitration({})).toEqual({});
    expect(normalizeWarframestatArbitration({ node: '  ' })).toEqual({});
  });
});
