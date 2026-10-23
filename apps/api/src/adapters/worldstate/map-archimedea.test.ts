import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { resolveArchimedeaModifierLabel } from './archimedea-labels.js';
import { mapArchimedea } from './map-archimedea.js';
import type { UpstreamWorldstate } from './types.js';

/**
 * 读取 fixtures 目录下的 JSON 片段。
 *
 * @param name - 文件名
 * @returns 解析后的对象
 */
function loadFixture<T>(name: string): T {
  const dir = dirname(fileURLToPath(import.meta.url));
  const text = readFileSync(resolve(dir, 'fixtures', name), 'utf8');
  return JSON.parse(text) as T;
}

describe('mapArchimedea', () => {
  it('maps CT_LAB and CT_HEX from sanitized Conquests fixture', () => {
    const raw = loadFixture<UpstreamWorldstate>('conquests.snippet.json');
    const dto = mapArchimedea(raw.Conquests);

    expect(dto).not.toBeNull();
    expect(dto!.seasons).toHaveLength(2);
    expect(dto!.seasons.map((s) => s.kind)).toEqual(['lab', 'hex']);

    const lab = dto!.seasons[0]!;
    expect(lab.missions).toHaveLength(3);
    expect(lab.variableKeys).toContain('NoPets');
    expect(lab.variables?.[0]?.zh).toBe('禁用同伴');
    expect(lab.missions[0]?.missionType?.zh).toBe('歼灭');
    expect(lab.missions[0]?.faction?.zh).toBe('墙中人');
    expect(lab.missions[0]?.difficulties[0]?.deviation?.zh).toBe('坚不可摧');
    expect(lab.missions[0]?.difficulties[1]?.riskKeys).toContain('EMPBlackHole');
    expect(lab.activation).toMatch(/^\d{4}-/);
    expect(lab.expiry).toMatch(/^\d{4}-/);

    const hex = dto!.seasons[1]!;
    // 无 labels.yaml 注入时 zh 可能仍为英文 Scaldra；en 稳定
    expect(hex.missions[0]?.faction?.en).toBe('Scaldra');
    expect(hex.missions[0]?.faction?.zh.length).toBeGreaterThan(0);
    expect(hex.missions[2]?.missionType?.zh).toBe('刺杀');
    expect(hex.variableKeys).toContain('AnemicShields');
  });

  it('returns null for empty or unknown types', () => {
    expect(mapArchimedea(undefined)).toBeNull();
    expect(mapArchimedea([])).toBeNull();
    expect(mapArchimedea([{ Type: 'CT_UNKNOWN', Missions: [] }])).toBeNull();
  });

  it('does not share types with alerts (fixture independence)', () => {
    const conquests = loadFixture<{ Conquests: unknown[] }>('conquests.snippet.json');
    const alerts = loadFixture<{ Alerts: unknown[] }>('alerts.snippet.json');
    expect(conquests.Conquests.length).toBeGreaterThan(0);
    expect(alerts.Alerts.length).toBeGreaterThan(0);
    // 科研 mapper 只读 Conquests，与 Alerts 字段无关
    expect(mapArchimedea(conquests.Conquests as never)).not.toBeNull();
  });
});

describe('resolveArchimedeaModifierLabel', () => {
  it('uses curated zh labels and humanizes unknown keys', () => {
    expect(resolveArchimedeaModifierLabel('DullBlades')).toEqual({
      zh: '钝重兵刃',
      en: 'Dull Blades',
    });
    expect(resolveArchimedeaModifierLabel('SomeNewModifier').en).toBe('Some New Modifier');
  });
});
