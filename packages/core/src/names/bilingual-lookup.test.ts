import { describe, expect, it } from 'vitest';

import { bilingualLookup, buildBilingualIndex } from './bilingual-lookup.js';
import { normalizeName } from './normalize-name.js';

describe('normalizeName', () => {
  it('folds case, spaces and middots like SDJK', () => {
    expect(normalizeName('阿索代Prime')).toBe(normalizeName('阿索代 prime'));
    expect(normalizeName('阿索代·Prime')).toBe('阿索代prime');
    expect(normalizeName('Corrosive Projection')).toBe('corrosiveprojection');
  });
});

describe('bilingualLookup', () => {
  const index = buildBilingualIndex([
    ['Corrosive Projection', '腐蚀投射'],
    ['Athodai', '阿索代'],
    ['Athodai Prime', '阿索代Prime'],
  ]);

  it('resolves zh→en exact hits', () => {
    const r = bilingualLookup(index, '腐蚀投射');
    expect(r.direction).toBe('zh_to_en');
    expect(r.hits[0]?.en).toBe('Corrosive Projection');
  });

  it('resolves en→zh exact hits', () => {
    const r = bilingualLookup(index, 'Athodai');
    expect(r.direction).toBe('en_to_zh');
    expect(r.hits[0]?.zh).toBe('阿索代');
  });

  it('returns substring candidates when not exact', () => {
    const r = bilingualLookup(index, '阿索');
    expect(r.hits).toHaveLength(0);
    expect(r.candidates.length).toBeGreaterThan(0);
  });
});
