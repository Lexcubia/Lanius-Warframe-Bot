import { describe, expect, it } from 'vitest';

import {
  VALENCE_CAP_PCT,
  fusionStepsToCap,
  parseValenceElement,
  parseValenceMaterialTokens,
  valenceBonusPct,
  valenceFusion,
} from './fusion.js';

describe('valenceBonusPct', () => {
  it('matches SDJK 1.1×max floor-1dp rule', () => {
    expect(valenceBonusPct(60, 58)).toBe(VALENCE_CAP_PCT);
    expect(valenceBonusPct(50, 50)).toBe(55);
    expect(valenceBonusPct(44, 44)).toBe(48.4);
  });

  it('caps at 60 when computed ≥58', () => {
    expect(valenceBonusPct(53, 53)).toBe(VALENCE_CAP_PCT);
  });
});

describe('valenceFusion', () => {
  it('keeps single option when elements match', () => {
    const r = valenceFusion('heat', 60, 'heat', 58);
    expect(r.percent).toBe(60);
    expect(r.options).toEqual(['heat']);
    expect(r.noteKind).toBe('same');
  });

  it('offers both elements without composing', () => {
    const r = valenceFusion('electricity', 60, 'heat', 58);
    expect(r.options).toEqual(['electricity', 'heat']);
    expect(r.noteKind).toBe('choose');
  });
});

describe('fusionStepsToCap', () => {
  it('returns empty when already capped', () => {
    expect(fusionStepsToCap(60)).toEqual([]);
  });

  it('traces same-value fusions to 60', () => {
    const steps = fusionStepsToCap(44);
    expect(steps.at(-1)).toBe(60);
    expect(steps[0]).toBe(48.4);
  });
});

describe('parseValenceElement / parseValenceMaterialTokens', () => {
  it('parses zh short aliases', () => {
    expect(parseValenceElement('电')).toBe('electricity');
    expect(parseValenceElement('火')).toBe('heat');
    expect(parseValenceElement('冲击')).toBe('impact');
  });

  it('parses material tokens like 电60 火58%', () => {
    const mats = parseValenceMaterialTokens(['电60', '火58%', '44']);
    expect(mats).toHaveLength(3);
    expect(mats[0]).toMatchObject({ element: 'electricity', percent: 60 });
    expect(mats[1]).toMatchObject({ element: 'heat', percent: 58 });
    expect(mats[2]).toMatchObject({ percent: 44 });
    expect(mats[2]?.element).toBeUndefined();
  });
});
