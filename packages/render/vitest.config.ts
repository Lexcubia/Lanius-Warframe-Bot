import { defineConfig } from 'vitest/config';

/**
 * `@lanius/render` 的 Vitest 配置。
 *
 * @returns 本包 Vitest 配置对象
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Chromium 截图测试文件串行，避免双开 Vite / Browser
    fileParallelism: false,
  },
});
