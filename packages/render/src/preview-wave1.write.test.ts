/**
 * SDJK Wave1 密列表卡预览 PNG（需 LANIUS_BROWSER_TESTS=1）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { shutdownVueCardCapture } from './chromium/capture-vue-card.js';
import { renderDenseListCard } from './render-worldstate.js';
import type { DenseListCardPayload } from './vue-cards/dense-list-types.js';

/**
 * Wave1 预览输出目录（默认仓库 tmp；可经 env 指到 agent store media）。
 *
 * @returns 绝对路径
 */
function resolvePreviewDir(): string {
  const fromEnv =
    process.env.LANIUS_WAVE1_PREVIEW_DIR?.trim() || process.env.LANIUS_QQ_CARD_PREVIEW_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/qq-cards-wave1');
}

const outDir = resolvePreviewDir();

/**
 * DenseList 样张列表。
 *
 * @returns 文件名与载荷对
 */
function samples(): Array<{ name: string; payload: DenseListCardPayload }> {
  const fetchedAt = new Date().toISOString();
  return [
    {
      name: 'darvo',
      payload: {
        title: '达沃特惠',
        kicker: 'DAILY DEALS',
        fetchedAt,
        rows: [
          { primary: '聚焦晶体', secondary: '50p / 100', meta: '3/5', remain: '12时' },
          { primary: '奥罗金催化剂蓝图', secondary: '20p / 40', meta: '1/1', remain: '12时' },
        ],
      },
    },
    {
      name: 'timers',
      payload: {
        title: '时效',
        kicker: 'TIMERS',
        fetchedAt,
        rows: [
          { primary: '夜灵平野', secondary: '夜晚', remain: '42分' },
          { primary: '每日突击', remain: '5时12分' },
          { primary: '仲裁', remain: '38分' },
          { primary: '周常重置', remain: '2天3时' },
        ],
      },
    },
    {
      name: 'news',
      payload: {
        title: '新闻',
        kicker: 'NEWS',
        fetchedAt,
        rows: [
          { primary: '热修：修复部分节点崩溃', secondary: 'forums.warframe.com/…' },
          { primary: '［社区］TennoCon 回顾', secondary: 'warframe.com/…' },
        ],
      },
    },
    {
      name: 'arb-table',
      payload: {
        title: '仲裁表',
        kicker: 'ARBITRATION',
        fetchedAt,
        note: '排期·节点·等级 arbi.wf.wiki',
        rows: [
          { primary: 'Hydron（Sedna）', secondary: '11-06 08:00 · 防御 · [A]' },
          { primary: 'Helene（Saturn）', secondary: '11-06 09:00 · 防御 · [S]' },
          { primary: 'Tessera（Venus）', secondary: '11-06 10:00 · 歼灭 · [B]' },
        ],
      },
    },
    {
      name: 'incarnon',
      payload: {
        title: '本周灵化',
        kicker: 'CIRCUIT',
        fetchedAt,
        note: 'Week 3/9',
        rows: [
          { primary: '拉特昂', secondary: 'Latron' },
          { primary: '勃朗宁', secondary: 'Bronco' },
        ],
      },
    },
    {
      name: 'steel-path',
      payload: {
        title: '钢铁精华',
        kicker: 'TESHIN',
        fetchedAt,
        rows: [
          { primary: 'Umbra Forma 蓝图', secondary: '本周轮换', meta: '150' },
          { primary: '裂罅破解器', meta: '20' },
          { primary: '主武器赋能适配器', meta: '15' },
        ],
      },
    },
  ];
}

describe('preview-wave1 denseList cards', () => {
  afterAll(async () => {
    await shutdownVueCardCapture();
  });

  it('writes representative Orokin PNGs when browser tests enabled', async () => {
    if (process.env.LANIUS_BROWSER_TESTS !== '1') {
      expect(true).toBe(true);
      return;
    }
    mkdirSync(outDir, { recursive: true });
    for (const sample of samples()) {
      const png = await renderDenseListCard({
        denseList: sample.payload,
        locale: 'zh',
        skin: 'orokin',
      });
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      writeFileSync(resolve(outDir, `${sample.name}.png`), png);
    }
  }, 120_000);
});
