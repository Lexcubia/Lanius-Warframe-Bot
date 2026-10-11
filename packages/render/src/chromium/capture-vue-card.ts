import type { Locale, WorldstateDto } from '@lanius/core';
import { laniusTokens } from '@lanius/ui/tokens';
import type { Page } from 'playwright';

import type { CardKind } from './card-kind.js';
import { ensureBrowser, shutdownBrowser } from './ensure-browser.js';
import { ensureCardHostOrigin, shutdownCardHost } from './ensure-card-host.js';

/**
 * Vue 模块卡片截图入参。
 */
export type CaptureVueCardInput = {
  kind: CardKind;
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/**
 * 卡片宿主注入到 `globalThis` 的挂载 API（避免 Node 侧依赖 DOM lib）。
 */
type CardHostGlobals = {
  __LANIUS_MOUNT_CARD__?: (payload: {
    kind: CardKind;
    worldstate: WorldstateDto;
    locale: Locale;
    stale?: boolean;
  }) => void;
  __LANIUS_CARD_READY__?: boolean;
};

/**
 * 卡片根节点选择器（与 `QqCardShell` 的 `data-lanius-card-root` 对齐）。
 */
const CARD_ROOT_SELECTOR = '[data-lanius-card-root]';

/**
 * 串行化截图，避免多页并发抢同一宿主挂载态。
 */
let captureChain: Promise<unknown> = Promise.resolve();

/**
 * 复用的 Playwright Page（同一 Browser Context）。
 */
let sharedPage: Page | null = null;

/**
 * 将 Vue 模块卡片在 Chromium 中挂载并截取根节点 PNG。
 *
 * @param input - 种类、世界状态 DTO 与 locale
 * @returns PNG 字节
 */
export async function captureVueCard(input: CaptureVueCardInput): Promise<Buffer> {
  const run = captureChain.then(() => captureOnce(input));
  captureChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * 关闭截图用 Browser / Vite 宿主与共享 Page。
 *
 * @returns 无返回值
 */
export async function shutdownVueCardCapture(): Promise<void> {
  if (sharedPage) {
    await sharedPage.close().catch(() => undefined);
    sharedPage = null;
  }
  await shutdownBrowser();
  await shutdownCardHost();
}

/**
 * 单次挂载 + 节点截图（调用方已串行化）。
 *
 * @param input - 截图入参
 * @returns PNG 字节
 */
async function captureOnce(input: CaptureVueCardInput): Promise<Buffer> {
  const origin = await ensureCardHostOrigin();
  const browser = await ensureBrowser();
  const page = await ensureSharedPage(browser, origin);
  const width = laniusTokens.card.width;

  await page.setViewportSize({ width: width + 24, height: 1200 });
  await page.evaluate(
    (payload) => {
      const host = globalThis as unknown as CardHostGlobals;
      const mount = host.__LANIUS_MOUNT_CARD__;
      if (typeof mount !== 'function') {
        throw new Error('card-host mount API missing');
      }
      mount(payload);
    },
    {
      kind: input.kind,
      worldstate: input.worldstate,
      locale: input.locale,
      stale: input.stale,
    },
  );

  await page.waitForFunction(() => {
    const host = globalThis as unknown as CardHostGlobals;
    return host.__LANIUS_CARD_READY__ === true;
  });
  const root = page.locator(CARD_ROOT_SELECTOR);
  await root.waitFor({ state: 'visible' });
  // 浏览器内脚本用字符串形式，避免 bot typecheck 引入 DOM 类型
  await page.evaluate(`async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    );
  }`);

  const png = await root.screenshot({
    type: 'png',
    animations: 'disabled',
  });
  return Buffer.from(png);
}

/**
 * 取得已导航到宿主页的共享 Page。
 *
 * @param browser - Playwright Browser
 * @param origin - 宿主 origin
 * @returns Page
 */
async function ensureSharedPage(
  browser: import('playwright').Browser,
  origin: string,
): Promise<Page> {
  if (sharedPage && !sharedPage.isClosed()) {
    return sharedPage;
  }
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    viewport: { width: laniusTokens.card.width + 24, height: 1200 },
  });
  sharedPage = await context.newPage();
  await sharedPage.goto(origin, { waitUntil: 'networkidle' });
  await pageWaitForMountApi(sharedPage);
  return sharedPage;
}

/**
 * 等待宿主页暴露挂载函数。
 *
 * @param page - Playwright Page
 * @returns 无返回值
 */
async function pageWaitForMountApi(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const host = globalThis as unknown as CardHostGlobals;
    return typeof host.__LANIUS_MOUNT_CARD__ === 'function';
  });
}
