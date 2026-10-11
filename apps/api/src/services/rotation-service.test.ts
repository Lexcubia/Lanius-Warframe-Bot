import { describe, expect, it } from 'vitest';

import {
  normalizeScheduleInput,
  parseRotationItemsJson,
} from './rotation-service.js';

describe('rotation-service items parse', () => {
  it('兼容纯字符串数组旧数据', () => {
    const items = parseRotationItemsJson(
      JSON.stringify(['Tenet Arca Plasmor', 'Tenet Envoy']),
    );
    expect(items).toEqual([
      { name: 'Tenet Arca Plasmor' },
      { name: 'Tenet Envoy' },
    ]);
  });

  it('解析对象数组中的 Valence 字段', () => {
    const items = parseRotationItemsJson(
      JSON.stringify([
        { name: 'Coda Hema', element: 'magnetic', bonusPct: 28.9 },
      ]),
    );
    expect(items[0]).toMatchObject({
      name: 'Coda Hema',
      element: 'magnetic',
      bonusPct: 28.9,
    });
  });

  it('解析 admin 管道行 Name | element | pct', () => {
    expect(normalizeScheduleInput('Tenet Agendus | heat | 45.2')).toEqual({
      name: 'Tenet Agendus',
      element: 'heat',
      bonusPct: 45.2,
    });
    expect(normalizeScheduleInput('Tenet Agendus | 火焰 | 40')).toEqual({
      name: 'Tenet Agendus',
      element: 'heat',
      bonusPct: 40,
    });
  });
});
