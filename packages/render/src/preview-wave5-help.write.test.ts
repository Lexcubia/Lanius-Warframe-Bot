/**
 * Wave5 帮助卡预览 PNG（需 LANIUS_BROWSER_TESTS=1）。
 */
import { buildHelpDto } from '@lanius/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderHelpCard } from './render-worldstate.js';

const outDir =
  process.env.LANIUS_WAVE5_PREVIEW_DIR?.trim() ||
  '/cursor/stores/bc-4d7c66be-70a8-44c1-8457-760a78beb7ee/media/sdjk-wave5';

describe('Wave5 help card preview', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes orokin-help.png from full catalog HelpDto', async () => {
    if (process.env.LANIUS_BROWSER_TESTS !== '1') {
      return;
    }
    mkdirSync(outDir, { recursive: true });
    const help = buildHelpDto();
    const png = await renderHelpCard({ locale: 'zh', help, skin: 'orokin' });
    writeFileSync(resolve(outDir, 'orokin-help.png'), png);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.length).toBeGreaterThan(1000);
  }, 120_000);
});
