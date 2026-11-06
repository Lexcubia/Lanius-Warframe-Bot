import { describe, expect, it } from 'vitest';

import { buildBilingualIndex } from '@lanius/core';

import { WikiToolsService } from './wiki-tools-service.js';

describe('WikiToolsService', () => {
  const service = new WikiToolsService({
    bilingualIndex: buildBilingualIndex([
      ['Corrosive Projection', '腐蚀投射'],
      ['Ash', 'Ash'],
    ]),
  });

  it('deep-links play terms to huiji wiki', () => {
    const wiki = service.lookupWiki('仲裁', 'zh');
    expect(wiki.found).toBe(true);
    expect(wiki.mode).toBe('page');
    expect(wiki.pageUrl).toContain('warframe.huijiwiki.com/wiki/');
    expect(wiki.pageName).toBe('仲裁');
  });

  it('translates official bilingual pairs', () => {
    const tr = service.translateName('腐蚀投射');
    expect(tr.direction).toBe('zh_to_en');
    expect(tr.hits[0]?.en).toBe('Corrosive Projection');
  });

  it('computes valence fusion like SDJK', () => {
    const fusion = service.computeValence(['电60', '火58'], 'zh');
    expect(fusion.mode).toBe('fusion');
    expect(fusion.percent).toBe(60);
    expect(fusion.options.map((o) => o.element)).toEqual(['electricity', 'heat']);
  });

  it('plans steps to cap from a single percent', () => {
    const plan = service.computeValence(['44'], 'zh');
    expect(plan.mode).toBe('plan');
    expect(plan.steps.at(-1)).toBe(60);
  });
});
