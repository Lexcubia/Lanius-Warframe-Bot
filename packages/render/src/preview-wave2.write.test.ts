import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderWave2LinesCard } from './render-wave2.js';

/**
 * Wave2 预览输出目录（默认仓库 tmp；可经 env 指到 agent store media）。
 *
 * @returns 绝对路径
 */
function resolvePreviewDir(): string {
  const fromEnv = process.env.LANIUS_QQ_CARD_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/qq-cards-wave2');
}

const outDir = resolvePreviewDir();

describe('Wave2 market / riven / relic card previews', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes Orokin Wave2 PNGs when browser tests enabled', async () => {
    if (process.env.LANIUS_BROWSER_TESTS !== '1') {
      expect(true).toBe(true);
      return;
    }
    mkdirSync(outDir, { recursive: true });

    const samples: Array<{ file: string; title: string; kicker: string; lines: string[] }> = [
      {
        file: 'orokin-ducats.png',
        title: '杜卡德垃圾',
        kicker: 'DUCATS',
        lines: [
          '金垃圾 · 杜/白 ↓ · 第1/3页',
          '1. Akbronco Prime 枪机  100d  dpp=8.33  ~12p',
          '2. Boar Prime 枪管  100d  dpp=7.14  ~14p',
          '3. Lex Prime 枪机  100d  dpp=6.67  ~15p',
        ],
      },
      {
        file: 'orokin-riven-analysis.png',
        title: '紫卡分析',
        kicker: 'RIVEN',
        lines: [
          '绝路 · 倾向 1.2 · rifle',
          '+暴击几率 180  [152.9–186.9]  Δ3.2%  pos78%',
          '+暴击伤害 100  [97.2–118.8]  Δ−7.4%  pos15%',
          '−装填速度 40  [33.8–41.3]  Δ5.1%  pos82%',
        ],
      },
      {
        file: 'orokin-relic.png',
        title: '遗物',
        kicker: 'RELIC',
        lines: [
          '古纪 Lith A1',
          '常见 · Forma 蓝图',
          '常见 · 布莱顿 Prime 枪管',
          '罕见 · Saryn Prime 头部神经光元蓝图',
          '稀有 · 史提托双枪 Prime 蓝图',
        ],
      },
      {
        file: 'orokin-trend.png',
        title: '价格趋势',
        kicker: 'TREND',
        lines: [
          '膛线',
          '48h 成交 120 · 中位 18',
          '90d 成交 2400 · 中位 17',
          '最新 19 vs 基线 16.5（90天）→ +15.2%',
        ],
      },
    ];

    for (const sample of samples) {
      const png = await renderWave2LinesCard({
        locale: 'zh',
        skin: 'orokin',
        title: sample.title,
        kicker: sample.kicker,
        lines: sample.lines,
      });
      const path = resolve(outDir, sample.file);
      writeFileSync(path, png);
      expect(png.length).toBeGreaterThan(1_000);
    }
  }, 120_000);
});
