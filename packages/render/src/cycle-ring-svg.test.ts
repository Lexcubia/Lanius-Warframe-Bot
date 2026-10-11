import { describe, expect, it } from 'vitest';

import { buildCycleRingDataUrl } from './cycle-ring-svg.js';

describe('buildCycleRingDataUrl', () => {
  it('returns a base64 SVG data URL with arc geometry', () => {
    const url = buildCycleRingDataUrl({
      progress: 0.55,
      activeColor: '#f0a030',
      trackColor: '#2f5f8a',
      glyph: 'E',
      size: 72,
    });
    expect(url.startsWith('data:image/svg+xml;base64,')).toBe(true);
    const svg = Buffer.from(url.split(',')[1] ?? '', 'base64').toString('utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('>E</text>');
    expect(svg).toContain('#f0a030');
    expect(svg).toContain('#2f5f8a');
  });

  it('handles empty and full progress without throwing', () => {
    expect(() =>
      buildCycleRingDataUrl({
        progress: 0,
        activeColor: '#3aa7d6',
        trackColor: '#e8a060',
        glyph: 'V',
      }),
    ).not.toThrow();
    expect(() =>
      buildCycleRingDataUrl({
        progress: 1,
        activeColor: '#3aa7d6',
        trackColor: '#e8a060',
        glyph: 'V',
      }),
    ).not.toThrow();
  });
});
