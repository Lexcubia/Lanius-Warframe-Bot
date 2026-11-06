import { describe, expect, it } from 'vitest';

import { formatTranslateText, formatValenceText, formatWikiText } from './wiki-tools-text.js';

describe('wiki-tools text formatters', () => {
  it('keeps wiki URL in plain text', () => {
    const text = formatWikiText(
      {
        query: 'Ash',
        found: true,
        pageName: 'Ash',
        pageUrl: 'https://warframe.huijiwiki.com/wiki/Ash',
        lines: ['EN: Ash', 'ZH: Ash'],
        alts: [],
        mode: 'page',
      },
      'zh',
    );
    expect(text).toContain('https://warframe.huijiwiki.com/wiki/Ash');
  });

  it('formats translate hits zh→en', () => {
    const text = formatTranslateText(
      {
        query: '腐蚀投射',
        direction: 'zh_to_en',
        hits: [{ en: 'Corrosive Projection', zh: '腐蚀投射' }],
        candidates: [],
      },
      'zh',
    );
    expect(text).toBe('[腐蚀投射] => Corrosive Projection');
  });

  it('formats valence lines under a title', () => {
    const text = formatValenceText(
      {
        mode: 'fusion',
        percent: 60,
        options: [],
        materials: [],
        steps: [],
        lines: ['◆ 融合结果：加成 60%'],
      },
      'zh',
    );
    expect(text.startsWith('效价融合')).toBe(true);
    expect(text).toContain('60%');
  });
});
