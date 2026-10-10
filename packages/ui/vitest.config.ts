import { defineConfig } from 'vitest/config';

/**
 * `@lanius/ui` 的 Vitest 配置（token 单测；Vue SFC 由 web 侧覆盖）。
 *
 * @returns 本包 Vitest 配置对象
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
