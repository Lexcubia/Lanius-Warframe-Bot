import type {
  HelpDto,
  Locale,
  MarketSearchDto,
  RivenSearchDto,
  VarziaDto,
  VoidTraderDto,
  WeaponRotationDto,
  WorldstateDto,
} from '@lanius/core';
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
  locale: Locale;
  stale?: boolean;
  worldstate?: WorldstateDto;
  help?: HelpDto;
  market?: MarketSearchDto;
  riven?: RivenSearchDto;
  voidTrader?: VoidTraderDto;
  varzia?: VarziaDto;
  weaponRotation?: WeaponRotationDto;
};

/**
 * 卡片宿主注入到 `globalThis` 的挂载 API。
 */
type CardHostGlobals = {
  __LANIUS_MOUNT_CARD__?: (payload: CaptureVueCardInput) => void;
  __LANIUS_CARD_READY__?: boolean;
};

/**
 * 卡片根节点选择器。
 */
const CARD_ROOT_SELECTOR = '[data-lanius-card-root]';

/**
 * 串行化截图。
 */
let captureChain: Promise<unknown> = Promise.resolve();

/**
 * 复用的 Playwright Page。
 */
let sharedPage: Page | null = null;

/**
 * 将 Vue 模块卡片在 Chromium 中挂载并截取根节点 PNG。
 *
 * @param input - 种类与载荷
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
 * 关闭截图用 Browser / 宿主与共享 Page。
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
 * 单次挂载 + 节点截图。
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
  await page.evaluate((payload) => {
    const host = globalThis as unknown as CardHostGlobals;
    const mount = host.__LANIUS_MOUNT_CARD__;
    if (typeof mount !== 'function') {
      throw new Error('card-host mount API missing');
    }
    mount(payload);
  }, input);

  await page.waitForFunction(() => {
    const host = globalThis as unknown as CardHostGlobals;
    return host.__LANIUS_CARD_READY__ === true;
  });
  const root = page.locator(CARD_ROOT_SELECTOR);
  await root.waitFor({ state: 'visible' });
  // 必须等字体与 CDN 图标 settle：否则入侵/商人等会出现白槽截图。
  await waitForCardAssets(page);

  const png = await root.screenshot({
    type: 'png',
    animations: 'disabled',
  });
  return Buffer.from(png);
}

/**
 * 等待卡片内字体与 `<img>` 加载完成（失败亦放行，避免永久卡住）。
 *
 * 说明：旧实现为 `page.evaluate('async () => …')`，字符串只求值出函数对象而未调用，
 * 图标等待从未生效。此处用立即执行的 async IIFE 字符串，且避免把 DOM 类型泄漏进
 * 消费方（bot）的 Node `tsc`。
 *
 * @param page - Playwright Page
 * @returns 无返回值
 */
async function waitForCardAssets(page: Page): Promise<void> {
  // Playwright 串形式：表达式须自行调用；async 函数体在浏览器内执行。
  await page.evaluate(`(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const images = Array.from(document.images);
    for (const img of images) {
      if (img.loading === 'lazy') {
        img.loading = 'eager';
      }
    }
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            const done = () => resolve();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
            if (img.complete) {
              resolve();
            }
          });
        }
        if (typeof img.decode === 'function' && img.naturalWidth > 0) {
          try {
            await img.decode();
          } catch (_) {
            /* 坏图仍放行，由组件占位兜底 */
          }
        }
      }),
    );
  })()`);
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
