import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderValenceCard, renderWikiCard } from './render-worldstate.js';

/**
 * Wave3 预览输出目录（默认仓库 tmp；可经 env 指到 agent store media）。
 *
 * @returns 绝对路径
 */
function resolvePreviewDir(): string {
  const fromEnv = process.env.LANIUS_QQ_CARD_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/qq-cards-wave3');
}

const outDir = resolvePreviewDir();

describe('Wave3 wiki / valence card previews', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes Orokin wiki + valence PNGs when browser tests enabled', async () => {
    if (process.env.LANIUS_BROWSER_TESTS !== '1') {
      expect(true).toBe(true);
      return;
    }
    mkdirSync(outDir, { recursive: true });

    const wikiPng = await renderWikiCard({
      locale: 'zh',
      skin: 'orokin',
      wiki: {
        query: '仲裁',
        found: true,
        pageName: '仲裁',
        pageUrl: 'https://warframe.huijiwiki.com/wiki/%E4%BB%B2%E8%A3%81',
        lines: ['玩法：仲裁', '灰机维基深链（短简介，非全文镜像）。'],
        alts: [],
        mode: 'page',
      },
    });
    const wikiPath = resolve(outDir, 'orokin-wiki.png');
    writeFileSync(wikiPath, wikiPng);
    expect(wikiPng.length).toBeGreaterThan(1_000);

    const valencePng = await renderValenceCard({
      locale: 'zh',
      skin: 'orokin',
      valence: {
        mode: 'fusion',
        percent: 60,
        options: [
          { element: 'electricity', label: { zh: '电击', en: 'Electricity' } },
          { element: 'heat', label: { zh: '火焰', en: 'Heat' } },
        ],
        note: '两者任选其一，不会合成复合元素',
        formula: '结果 = 较高值 60% × 1.1 → ≥58% 直接进位 60%',
        materials: [
          {
            element: 'electricity',
            elementLabel: { zh: '电击', en: 'Electricity' },
            percent: 60,
          },
          { element: 'heat', elementLabel: { zh: '火焰', en: 'Heat' }, percent: 58 },
        ],
        steps: [],
        lines: [
          '◆ 融合结果：加成 60%',
          '◆ 融合材料：电击60% ＋ 火焰58%',
          '◆ 元素：电击 或 火焰（两者任选其一，不会合成复合元素）',
          '◆ 公式：结果 = 较高值 60% × 1.1 → ≥58% 直接进位 60%',
        ],
      },
    });
    const valencePath = resolve(outDir, 'orokin-valence.png');
    writeFileSync(valencePath, valencePng);
    expect(valencePng.length).toBeGreaterThan(1_000);

    const translateNote = resolve(outDir, 'translate-text-only.txt');
    writeFileSync(
      translateNote,
      '[腐蚀投射] => Corrosive Projection\n(SDJK-aligned: translate is text-only; no PNG card)\n',
      'utf8',
    );
  }, 120_000);
});
