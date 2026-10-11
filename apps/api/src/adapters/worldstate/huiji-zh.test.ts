import { describe, expect, it } from 'vitest';

import { toHuijiZh } from './huiji-zh.js';

describe('toHuijiZh', () => {
  it('maps traditional planet names to Huijiwiki simplified forms', () => {
    expect(toHuijiZh('Draco (穀神星)')).toBe('Draco (谷神星)');
    expect(toHuijiZh('Abaddon (歐羅巴)')).toBe('Abaddon (欧罗巴)');
    expect(toHuijiZh('Hydron (賽德娜)')).toBe('Hydron (赛德娜)');
    expect(toHuijiZh('Akkad (鬩神星)')).toBe('Akkad (阋神星)');
    expect(toHuijiZh('Nabuk (Kuva 要塞)')).toBe('Nabuk (赤毒要塞)');
  });

  it('leaves already-aligned text unchanged', () => {
    expect(toHuijiZh('Grineer')).toBe('Grineer');
    expect(toHuijiZh('Kiliken (金星)')).toBe('Kiliken (金星)');
  });
});
