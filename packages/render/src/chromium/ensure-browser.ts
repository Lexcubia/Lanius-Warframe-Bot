import { chromium, type Browser, type LaunchOptions } from 'playwright';

/**
 * 进程内复用的 Chromium 实例。
 */
let browser: Browser | null = null;

/**
 * 无头启动公共参数。
 */
const LAUNCH_ARGS: LaunchOptions = {
  headless: true,
  args: ['--disable-dev-shm-usage'],
};

/**
 * 依次尝试：Playwright 自带 Chromium → 本机 Chrome → 本机 Edge。
 *
 * @returns Playwright Browser
 * @throws 全部失败时抛出带安装提示的错误
 */
export async function ensureBrowser(): Promise<Browser> {
  if (browser?.isConnected()) {
    return browser;
  }

  const attempts: Array<{ label: string; options: LaunchOptions }> = [
    { label: 'playwright-chromium', options: { ...LAUNCH_ARGS } },
    { label: 'channel:chrome', options: { ...LAUNCH_ARGS, channel: 'chrome' } },
    { label: 'channel:msedge', options: { ...LAUNCH_ARGS, channel: 'msedge' } },
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      browser = await chromium.launch(attempt.options);
      return browser;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`${attempt.label}: ${detail}`);
    }
  }

  throw new Error(
    [
      'Playwright 无法启动 Chromium/Chrome/Edge。',
      '可执行：pnpm --filter @lanius/render browsers:install',
      '或安装本机 Google Chrome / Microsoft Edge。',
      ...errors,
    ].join('\n'),
  );
}

/**
 * 关闭复用的 Browser（测试 teardown / 进程退出）。
 *
 * @returns 无返回值
 */
export async function shutdownBrowser(): Promise<void> {
  const active = browser;
  browser = null;
  if (active) {
    await active.close();
  }
}
