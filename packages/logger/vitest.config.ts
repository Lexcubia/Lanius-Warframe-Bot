import { defineConfig } from 'vitest/config';

/**
 * `@lanius/logger` 的 Vitest 配置。
 *
 * @returns 本包 Vitest 配置对象
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
