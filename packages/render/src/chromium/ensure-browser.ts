import { existsSync, readFileSync } from 'node:fs';

import { chromium, type Browser, type LaunchOptions } from 'playwright';

/**
 * 进程内复用的 Chromium 实例。
 */
let browser: Browser | null = null;

/**
 * 是否运行在 Docker / OCI 容器内（存在 `/.dockerenv` 或 cgroup 含 docker/kubepods）。
 *
 * @returns 判定为容器环境时为 `true`
 */
function runningInContainer(): boolean {
  try {
    if (existsSync('/.dockerenv')) {
      return true;
    }
    const cgroup = readFileSync('/proc/1/cgroup', 'utf8');
    return /docker|kubepods|containerd/i.test(cgroup);
  } catch {
    return process.env.LANIUS_PLAYWRIGHT_NO_SANDBOX === '1';
  }
}

/**
 * 无头启动公共参数。
 * 容器内非 root 用户需 `--no-sandbox`，否则 Chromium 无法拉起。
 */
const LAUNCH_ARGS: LaunchOptions = {
  headless: true,
  args: [
    '--disable-dev-shm-usage',
    ...(runningInContainer() || process.env.LANIUS_PLAYWRIGHT_NO_SANDBOX === '1'
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : []),
  ],
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
