import { describe, expect, it } from 'vitest';

import { findContentBottom, rasterizeCard } from './rasterize-card.js';
import { el } from './satori-el.js';

describe('findContentBottom', () => {
  it('finds the last non-void row', () => {
    const width = 4;
    const height = 6;
    const pixels = Buffer.alloc(width * height * 4, 0);
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const o = (y * width + x) * 4;
        pixels[o] = 255;
        pixels[o + 1] = 248;
        pixels[o + 2] = 242;
        pixels[o + 3] = 255;
      }
    }
    for (let x = 0; x < width; x += 1) {
      const o = (3 * width + x) * 4;
      pixels[o] = 255;
      pixels[o + 1] = 255;
      pixels[o + 2] = 255;
      pixels[o + 3] = 255;
    }
    for (let y = 4; y < 6; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const o = (y * width + x) * 4;
        pixels[o] = 255;
        pixels[o + 1] = 248;
        pixels[o + 2] = 242;
        pixels[o + 3] = 255;
      }
    }
    expect(findContentBottom(pixels, width, height)).toBe(4);
  });
});

describe('rasterizeCard', () => {
  it('renders final PNG at measured height without crop artifacts', async () => {
    const tree = el('div', {
      style: {
        width: 640,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff8f2',
        padding: 12,
      },
      children: [
        el('div', {
          style: {
            display: 'flex',
            fontSize: 18,
            color: '#2f8fc4',
            marginBottom: 8,
          },
          children: '两遍渲染测高',
        }),
        el('div', {
          style: {
            display: 'flex',
            height: 80,
            background: '#ffffff',
            borderRadius: 8,
            color: '#2a3142',
          },
          children: 'body',
        }),
      ],
    });

    const png = await rasterizeCard(tree);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

    const height = png.readUInt32BE(20);
    expect(height).toBeGreaterThan(80);
    // 最终画布高度应贴近内容，而非探测用的 4096
    expect(height).toBeLessThan(220);
  });
});
