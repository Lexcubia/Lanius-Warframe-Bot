import { defineConfig } from 'vitest/config';

/**
 * 依赖 Playwright Chromium 的截图 / 预览用例路径（相对本包根）。
 * CI 默认跳过，避免 `playwright install`；本地可用 `LANIUS_BROWSER_TESTS=1` 强制跑。
 */
const BROWSER_TEST_GLOBS = [
  'src/render-worldstate.test.ts',
  'src/preview-card.write.test.ts',
  'src/preview-p3.write.test.ts',
  'src/preview-alerts.write.test.ts',
  'src/preview-dense.write.test.ts',
  'src/preview-sortie-archon.write.test.ts',
  'src/preview-fill-layout.write.test.ts',
  'src/preview-circuit.write.test.ts',
  'src/preview-archimedea.write.test.ts',
  'src/preview-bounties.write.test.ts',
] as const;

/**
 * Vitest 默认会排除的路径；自定义 `exclude` 会覆盖默认值，故需显式保留。
 */
const VITEST_DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/cypress/**',
  '**/.{idea,git,cache,output,temp}/**',
  '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
] as const;

/**
 * 是否跳过依赖浏览器的截图用例。
 *
 * - `LANIUS_BROWSER_TESTS=1`：强制跑（覆盖 CI）
 * - `LANIUS_SKIP_BROWSER_TESTS=1`：强制跳过
 * - 否则：GitHub Actions 等 `CI=true` 时跳过；本地默认跑（需已装 Chromium）
 *
 * @returns 为 true 时把浏览器相关测试文件加入 exclude
 */
function shouldSkipBrowserTests(): boolean {
  if (process.env.LANIUS_BROWSER_TESTS === '1') {
    return false;
  }
  if (process.env.LANIUS_SKIP_BROWSER_TESTS === '1') {
    return true;
  }
  return process.env.CI === 'true';
}

/**
 * `@lanius/render` 的 Vitest 配置。
 *
 * @returns 本包 Vitest 配置对象
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: [
      ...VITEST_DEFAULT_EXCLUDE,
      ...(shouldSkipBrowserTests() ? [...BROWSER_TEST_GLOBS] : []),
    ],
    // Chromium 截图测试文件串行，避免双开 Vite / Browser
    fileParallelism: false,
  },
});
